/**
 * Fake async API. Everything the UI needs goes through here, so swapping in a
 * real backend means replacing this file only.
 *
 * The demo state is forced with `?state=filled|empty|error|loading`.
 */
import { companies, TODAY } from "@/data/companies";
import { generateEntries } from "@/data/generate";
import type { DemoState, EntryDraft, KsefState, PeriodInfo, RegisterEntry, RegisterKind, RegisterResponse } from "./types";
import { computeVat, round2 } from "./vat";
import { normalizeNip } from "./nip";
import { seriesOf } from "./labels";

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string,
    /** id of a related record, e.g. the existing duplicate */
    public ref?: string,
  ) {
    super(message);
  }
}

const store = new Map<string, RegisterEntry[]>();
const confirmed = new Map<string, string>(); // `${company}|${y}-${m}` -> ISO date

const pad = (n: number) => String(n).padStart(2, "0");
const key = (c: string, r: RegisterKind, y: number, m: number) => `${c}|${r}|${y}-${pad(m)}`;

function bucket(companyId: string, register: RegisterKind, year: number, month: number) {
  const k = key(companyId, register, year, month);
  let list = store.get(k);
  if (!list) {
    const company = companies.find((c) => c.id === companyId)!;
    list = generateEntries(companyId, company.nip, register, year, month);
    store.set(k, list);
    if (register === "sales") seedKsef(companyId, list);
  }
  return list;
}

/* ───────────── KSeF simulation ─────────────
 * send → "queued" → "processing" → "accepted" | "rejected", driven by time and advanced on every read.
 * Rejections are deterministic: a NIP / FA(3) rejection repeats until the offending field is changed. */
const QUEUE_MS = 1300;
const PROCESS_MS = 2400;
interface KsefJob {
  companyId: string;
  queuedAt: number;
  outcome: KsefState;
}
const jobs = new Map<string, KsefJob>();
/** value of the field that caused a rejection — resending without changing it fails again */
const rejectedWith = new Map<string, string>();
/** documents whose next send hits an expired session (demo of SESJA_WYGASLA) */
const sessionFailsOnce = new Set<string>();

function seedKsef(companyId: string, list: RegisterEntry[]) {
  for (const e of list) {
    if (e.ksef.status === "rejected" && e.ksef.error?.code === "NIP_NABYWCY") rejectedWith.set(e.id, e.counterparty.nip);
    if (e.ksef.status === "rejected" && e.ksef.error?.code === "SCHEMAT_FA3") rejectedWith.set(e.id, e.description);
    if (e.ksef.status === "queued") jobs.set(e.id, { companyId, queuedAt: Date.now(), outcome: accepted(companyId, e) });
  }
  const lastNotSent = [...list].reverse().find((e) => e.ksef.status === "not_sent");
  if (lastNotSent) sessionFailsOnce.add(lastNotSent.id);
}

function accepted(companyId: string, e: RegisterEntry): KsefState {
  const company = companies.find((c) => c.id === companyId)!;
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString();
  const at = `${TODAY}T${local.slice(11, 19)}`;
  let h = 0;
  for (const ch of e.id + at) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  const hex = (h.toString(16).toUpperCase() + "A3F9C1B2E4D7").slice(0, 12);
  return { status: "accepted", number: `${company.nip}-${TODAY.replaceAll("-", "")}-${hex}-${hex.slice(3, 5)}`, acceptedAt: at };
}

function decide(companyId: string, e: RegisterEntry): KsefState {
  const sentAt = `${TODAY}T${new Date().toTimeString().slice(0, 8)}`;
  if (sessionFailsOnce.delete(e.id)) return { status: "not_sent", sentAt, error: { code: "SESJA_WYGASLA" } };
  const code = e.ksef.error?.code;
  if (code === "NIP_NABYWCY" && rejectedWith.get(e.id) === e.counterparty.nip) return { status: "rejected", sentAt, error: { code } };
  if (code === "SCHEMAT_FA3" && rejectedWith.get(e.id) === e.description) return { status: "rejected", sentAt, error: e.ksef.error };
  if (e.issueDate > TODAY) return { status: "rejected", sentAt, error: { code: "DATA_PRZYSZLA" } };
  rejectedWith.delete(e.id);
  return accepted(companyId, e);
}

/** Moves queued documents forward in time. Called on every read, so polling drives the simulation. */
function advanceKsef() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    const f = findEntry(job.companyId, id);
    if (!f) {
      jobs.delete(id);
      continue;
    }
    const e = f.list[f.idx];
    const t = now - job.queuedAt;
    if (t >= QUEUE_MS + PROCESS_MS) {
      e.ksef = job.outcome;
      jobs.delete(id);
    } else if (t >= QUEUE_MS) e.ksef = { ...e.ksef, status: "processing" };
  }
}

const [TY, TM] = TODAY.split("-").map(Number);

export function periodInfo(companyId: string, year: number, month: number): PeriodInfo {
  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  const jpkDeadline = `${ny}-${pad(nm)}-25`;
  const isPast = year < TY || (year === TY && month < TM);
  const isFuture = year > TY || (year === TY && month > TM);
  const ck = `${companyId}|${year}-${pad(month)}`;
  const manualConfirm = confirmed.get(ck);
  return {
    year,
    month,
    confirmed: isPast || !!manualConfirm,
    confirmedAt: manualConfirm ?? (isPast ? `${ny}-${pad(nm)}-05` : undefined),
    jpkStatus: isPast ? "sent" : isFuture ? "future" : "due",
    jpkSentAt: isPast ? `${ny}-${pad(nm)}-${companyId === "klos" ? 24 : 20}` : undefined,
    jpkDeadline,
  };
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

const latency = () => 350 + Math.random() * 350;

export interface RegisterQuery {
  companyId: string;
  register: RegisterKind;
  year: number;
  month: number;
  state: DemoState;
  signal?: AbortSignal;
}

export async function getRegister(q: RegisterQuery): Promise<RegisterResponse> {
  if (q.state === "loading") {
    await new Promise<never>((_, reject) =>
      q.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))),
    );
  }
  await wait(latency(), q.signal);
  advanceKsef();
  if (q.state === "error") {
    throw new ApiError("Serwer rejestrów nie odpowiada.", "REG-503");
  }
  const period = periodInfo(q.companyId, q.year, q.month);
  if (q.state === "empty") {
    return { entries: [], vatDue: { output: 0, input: 0 }, counts: { sales: 0, purchase: 0 }, ksefIssues: { rejected: 0, notSent: 0 }, period };
  }
  const sales = bucket(q.companyId, "sales", q.year, q.month);
  const purchases = bucket(q.companyId, "purchase", q.year, q.month);
  const sum = (l: RegisterEntry[]) => round2(l.reduce((a, e) => a + e.vat, 0));
  return {
    entries: structuredClone(q.register === "sales" ? sales : purchases),
    vatDue: { output: sum(sales), input: sum(purchases) },
    counts: { sales: sales.length, purchase: purchases.length },
    ksefIssues: {
      rejected: sales.filter((e) => e.ksef.status === "rejected").length,
      notSent: sales.filter((e) => e.ksef.status === "not_sent").length,
    },
    period,
  };
}

export async function getPeriods(companyId: string, year: number): Promise<PeriodInfo[]> {
  return Array.from({ length: 12 }, (_, i) => periodInfo(companyId, year, i + 1));
}

export async function confirmPeriod(companyId: string, year: number, month: number) {
  await wait(600);
  confirmed.set(`${companyId}|${year}-${pad(month)}`, TODAY);
  return periodInfo(companyId, year, month);
}

function monthOf(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return { y, m };
}

function findEntry(companyId: string, id: string) {
  for (const [k, list] of store) {
    if (!k.startsWith(`${companyId}|`)) continue;
    const idx = list.findIndex((e) => e.id === id);
    if (idx >= 0) return { list, idx };
  }
  return null;
}

let seq = 1000;

/** A confirmed period is read-only: nothing may be written into it or removed from it. */
function assertOpen(companyId: string, iso: string, field?: string) {
  const { y, m } = monthOf(iso);
  if (periodInfo(companyId, y, m).confirmed)
    throw new ApiError(`Okres ${pad(m)}/${y} jest potwierdzony — zmiany nie są możliwe.`, "PERIOD_LOCKED", field);
}

/** Next free register number in the month (max + 1), so deletes and undo never produce duplicates. */
function nextIdentifier(list: RegisterEntry[], register: RegisterKind, month: number) {
  const max = list.reduce((a, e) => Math.max(a, Number(e.identifier.split("/")[2]) || 0), 0);
  return `${register === "sales" ? "RS" : "RZ"}/${pad(month)}/${String(max + 1).padStart(3, "0")}`;
}

export async function saveEntry(companyId: string, draft: EntryDraft, id?: string): Promise<RegisterEntry> {
  await wait(latency() + 200);
  const { y, m } = monthOf(draft.issueDate);
  assertOpen(companyId, draft.issueDate, "issueDate");
  const list = bucket(companyId, draft.register, y, m);
  const duplicate = list.find(
    (e) => e.id !== id && e.number.trim().toLowerCase() === draft.number.trim().toLowerCase() &&
      normalizeNip(e.counterparty.nip) === normalizeNip(draft.counterparty.nip),
  );
  if (duplicate) {
    throw new ApiError(`Dokument ${duplicate.number} od tego kontrahenta już istnieje.`, "DUPLICATE", "number", duplicate.id);
  }
  const { vat, gross } = computeVat(draft.net, draft.vatRate);
  const prev = id ? findEntry(companyId, id) : null;
  const old = prev ? prev.list[prev.idx] : undefined;
  if (old) assertOpen(companyId, old.issueDate);
  if (prev) prev.list.splice(prev.idx, 1);
  const entry: RegisterEntry = {
    ...draft,
    counterparty: { ...draft.counterparty, nip: normalizeNip(draft.counterparty.nip) },
    id: old?.id ?? `${companyId}-new-${seq++}`,
    identifier: old && old.identifier.split("/")[1] === pad(m) ? old.identifier : nextIdentifier(list, draft.register, m),
    vat,
    gross,
    jpkCodes: draft.jpkCodes ?? old?.jpkCodes ?? [],
    series: seriesOf(draft.number),
    ksef: draft.register === "sales" ? (old && old.ksef.status !== "accepted" ? { ...old.ksef } : old?.ksef ?? { status: "not_sent" }) : old?.ksef ?? { status: "outside" },
  };
  list.push(entry);
  list.sort((a, b) => a.issueDate.localeCompare(b.issueDate));
  return structuredClone(entry);
}

export async function deleteEntry(companyId: string, id: string) {
  await wait(300);
  const f = findEntry(companyId, id);
  if (!f) throw new ApiError("Nie znaleziono dokumentu.", "NOT_FOUND");
  assertOpen(companyId, f.list[f.idx].issueDate);
  const [removed] = f.list.splice(f.idx, 1);
  return removed;
}

export async function restoreEntry(companyId: string, entry: RegisterEntry) {
  await wait(200);
  const { y, m } = monthOf(entry.issueDate);
  const list = bucket(companyId, entry.register, y, m);
  list.push(entry);
  list.sort((a, b) => a.issueDate.localeCompare(b.issueDate));
}

/** Puts the invoice into the KSeF queue; the outcome arrives a few seconds later (poll with getRegister). */
export async function sendToKsef(companyId: string, id: string) {
  await wait(300);
  const f = findEntry(companyId, id);
  if (!f) throw new ApiError("Nie znaleziono dokumentu.", "NOT_FOUND");
  const e = f.list[f.idx];
  if (e.register !== "sales" || e.ksef.status === "accepted" || jobs.has(id)) return structuredClone(e);
  const outcome = decide(companyId, e);
  if (outcome.status === "rejected" && outcome.error?.code === "NIP_NABYWCY") rejectedWith.set(id, e.counterparty.nip);
  if (outcome.status === "rejected" && outcome.error?.code === "SCHEMAT_FA3") rejectedWith.set(id, e.description);
  e.ksef = { status: "queued", sentAt: outcome.sentAt ?? `${TODAY}T${new Date().toTimeString().slice(0, 8)}`, error: e.ksef.error };
  jobs.set(id, { companyId, queuedAt: Date.now(), outcome });
  return structuredClone(e);
}

/** "Odnów połączenie": renews the KSeF session token (demo always succeeds). */
export async function renewKsefSession() {
  await wait(900);
  return { validUntil: `${TODAY}T23:59:59` };
}

export async function syncFromKsef(): Promise<number> {
  await wait(1200);
  return 0;
}

/** "Oznacz kodami JPK" [B9]: adds the chosen GTU/procedure markers to the selected documents. */
export async function addJpkCodes(companyId: string, ids: string[], codes: string[]) {
  await wait(400);
  let n = 0;
  for (const id of ids) {
    const f = findEntry(companyId, id);
    if (!f) continue;
    const e = f.list[f.idx];
    e.jpkCodes = [...new Set([...e.jpkCodes, ...codes])];
    n++;
  }
  return n;
}

export interface Upo {
  ksefNumber: string;
  acceptedAt: string;
  sellerNip: string;
  invoiceNumber: string;
  hash: string;
  sessionRef: string;
}

/** UPO (Urzędowe Poświadczenie Odbioru) of an accepted invoice — deterministic demo data. */
export async function getUpo(companyId: string, id: string): Promise<Upo> {
  await wait(latency());
  const f = findEntry(companyId, id);
  if (!f) throw new ApiError("Nie znaleziono dokumentu.", "NOT_FOUND");
  const e = f.list[f.idx];
  if (e.ksef.status !== "accepted" || !e.ksef.number) throw new ApiError("UPO jest jeszcze niedostępne. Zwykle pojawia się kilka minut po przyjęciu.", "UPO_PENDING");
  let h = 2166136261;
  for (const ch of e.ksef.number) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const hex = Array.from({ length: 8 }, (_, i) => ((h >>> 0) * (i + 7) % 4294967296).toString(16).padStart(8, "0")).join("");
  const company = companies.find((c) => c.id === companyId)!;
  return {
    ksefNumber: e.ksef.number,
    acceptedAt: e.ksef.acceptedAt ?? `${e.issueDate}T12:00:00`,
    sellerNip: e.register === "sales" ? company.nip : e.counterparty.nip,
    invoiceNumber: e.number,
    hash: hex,
    sessionRef: `${(e.ksef.acceptedAt ?? e.issueDate).slice(0, 10).replaceAll("-", "")}-SO-${hex.slice(0, 10).toUpperCase()}-${hex.slice(10, 12).toUpperCase()}`,
  };
}

/** "Otwórz okres ponownie" — demo only; a month whose JPK was already sent cannot be reopened. */
export async function reopenPeriod(companyId: string, year: number, month: number) {
  await wait(500);
  const info = periodInfo(companyId, year, month);
  if (info.jpkStatus === "sent") throw new ApiError("JPK za ten okres został wysłany. Zmiany wymagają korekty JPK.", "JPK_SENT");
  confirmed.delete(`${companyId}|${year}-${pad(month)}`);
  return periodInfo(companyId, year, month);
}

export interface JpkField {
  code: string;
  label: string;
  value: number;
}
export interface JpkPreview {
  period: PeriodInfo;
  sales: JpkField[];
  purchases: JpkField[];
  totals: JpkField[];
  counts: Record<RegisterKind, number>;
}

/**
 * JPK_V7M(2) declaration part, computed from both registers.
 * Sales by rate → P_10 zw · P_11 np · P_13 0% · P_15/16 5% · P_17/18 8% · P_19/20 23%; P_37/P_38 sums.
 * Purchases are all "pozostałe nabycia" in the demo → P_42/P_43; P_48 total input VAT;
 * P_51 to pay, or P_53/P_62 surplus carried forward.
 */
export async function getJpkPreview(companyId: string, year: number, month: number, state: DemoState): Promise<JpkPreview> {
  await wait(latency());
  if (state === "error") throw new ApiError("Nie udało się przygotować JPK.", "JPK-503");
  const empty = state === "empty";
  const sales = empty ? [] : bucket(companyId, "sales", year, month);
  const purchases = empty ? [] : bucket(companyId, "purchase", year, month);
  const by = (r: string, f: "net" | "vat") => round2(sales.filter((e) => e.vatRate === r).reduce((a, e) => a + e[f], 0));
  const s: JpkField[] = [
    { code: "P_10", label: "Dostawa zwolniona", value: by("zw", "net") },
    { code: "P_11", label: "Poza terytorium kraju (np)", value: by("np", "net") },
    { code: "P_13", label: "Podstawa 0%", value: by("0", "net") },
    { code: "P_15", label: "Podstawa 5%", value: by("5", "net") },
    { code: "P_16", label: "Podatek 5%", value: by("5", "vat") },
    { code: "P_17", label: "Podstawa 8%", value: by("8", "net") },
    { code: "P_18", label: "Podatek 8%", value: by("8", "vat") },
    { code: "P_19", label: "Podstawa 23%", value: by("23", "net") },
    { code: "P_20", label: "Podatek 23%", value: by("23", "vat") },
  ];
  const p37 = round2(["P_10", "P_11", "P_13", "P_15", "P_17", "P_19"].reduce((a, c) => a + s.find((x) => x.code === c)!.value, 0));
  const p38 = round2(by("5", "vat") + by("8", "vat") + by("23", "vat"));
  const p42 = round2(purchases.reduce((a, e) => a + e.net, 0));
  const p43 = round2(purchases.reduce((a, e) => a + e.vat, 0));
  const due = round2(p38 - p43);
  return {
    period: periodInfo(companyId, year, month),
    sales: s,
    purchases: [
      { code: "P_42", label: "Nabycie pozostałe — netto", value: p42 },
      { code: "P_43", label: "Nabycie pozostałe — podatek", value: p43 },
    ],
    totals: [
      { code: "P_37", label: "Razem podstawa", value: p37 },
      { code: "P_38", label: "Razem podatek należny", value: p38 },
      { code: "P_48", label: "Razem podatek naliczony", value: p43 },
      due >= 0 ? { code: "P_51", label: "Do wpłaty", value: due } : { code: "P_62", label: "Nadwyżka do przeniesienia", value: -due },
    ],
    counts: { sales: sales.length, purchase: purchases.length },
  };
}
