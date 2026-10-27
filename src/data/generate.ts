import type { DocType, KsefStatus, RegisterEntry, RegisterKind, VatRate } from "@/lib/types";
import { nipChecksum } from "@/lib/nip";
import { seriesOf } from "@/lib/labels";
import { computeVat, round2 } from "@/lib/vat";
import { TODAY } from "./companies";

/* Deterministic PRNG so the demo data is stable between reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function makeNip(rand: () => number) {
  for (;;) {
    let nine = String(1 + Math.floor(rand() * 9));
    for (let i = 0; i < 8; i++) nine += Math.floor(rand() * 10);
    const c = nipChecksum(nine);
    if (c !== 10) return nine + c;
  }
}

type Party = { name: string; city: string };
type Item = { text: string; rate: VatRate; min: number; max: number; gtu?: string };

interface Profile {
  sales: { parties: Party[]; items: Item[]; count: number; prefix: string; receipts?: boolean };
  purchase: { parties: Party[]; items: Item[]; count: number };
}

const profiles: Record<string, Profile> = {
  nordwind: {
    sales: {
      prefix: "FV",
      count: 24,
      parties: [
        { name: "Hurtownia Mazur Sp. z o.o.", city: "Olsztyn" },
        { name: "Bałtyk Logistics S.A.", city: "Gdynia" },
        { name: "Kancelaria Nowicka i Wspólnicy", city: "Warszawa" },
        { name: "Szkoła Językowa Lingua Viva", city: "Sopot" },
        { name: "Fabryka Mebli Dąbrowski Sp. j.", city: "Swarzędz" },
        { name: "Agencja Kreatywna Pixelowo", city: "Wrocław" },
        { name: "Klinika Weterynaryjna Azor", city: "Gdańsk" },
        { name: "Transport Krawczyk Sp. z o.o.", city: "Toruń" },
        { name: "Hotel Pod Żurawiem", city: "Gdańsk" },
        { name: "Studio Architektury Lis", city: "Poznań" },
      ],
      items: [
        { text: "Usługi programistyczne – rozwój aplikacji", rate: "23", min: 4800, max: 38000 },
        { text: "Abonament SaaS – pakiet Team", rate: "23", min: 290, max: 2400 },
        { text: "Utrzymanie i wsparcie techniczne", rate: "23", min: 900, max: 6500 },
        { text: "Szkolenie zespołu – warsztaty", rate: "zw", min: 1500, max: 7200 },
        { text: "Usługi IT dla klienta z UE (odwrotne obciążenie)", rate: "np", min: 2400, max: 9600 },
        { text: "Licencja oprogramowania (e-book)", rate: "5", min: 120, max: 900 },
        { text: "Wdrożenie systemu CRM", rate: "23", min: 6000, max: 24000, gtu: "GTU_12" },
      ],
    },
    purchase: {
      count: 17,
      parties: [
        { name: "Cloudline Hosting Sp. z o.o.", city: "Kraków" },
        { name: "Biuro Coworking Garnizon", city: "Gdańsk" },
        { name: "Stacja Paliw Wiśniewski", city: "Pruszcz Gdański" },
        { name: "Elektro-Hurt Kowalczyk", city: "Gdynia" },
        { name: "Telekom Pomorze S.A.", city: "Gdańsk" },
        { name: "Kawa i Ekspres Sp. z o.o.", city: "Łódź" },
        { name: "Leasing Auto Plus S.A.", city: "Warszawa" },
      ],
      items: [
        { text: "Serwery i hosting – październik", rate: "23", min: 600, max: 4200 },
        { text: "Najem biura", rate: "23", min: 3200, max: 5400 },
        { text: "Paliwo – samochód służbowy", rate: "23", min: 180, max: 640, gtu: "GTU_02" },
        { text: "Sprzęt komputerowy", rate: "23", min: 1200, max: 9800, gtu: "GTU_07" },
        { text: "Usługi telekomunikacyjne", rate: "23", min: 140, max: 520 },
        { text: "Kawa i artykuły spożywcze", rate: "5", min: 90, max: 420 },
        { text: "Rata leasingowa", rate: "23", min: 1800, max: 2600 },
      ],
    },
  },
  klos: {
    sales: {
      prefix: "FS",
      count: 30,
      receipts: true,
      parties: [
        { name: "Kawiarnia Pod Lipami", city: "Lublin" },
        { name: "Sklep Spożywczy Ula", city: "Świdnik" },
        { name: "Restauracja Stary Rynek", city: "Lublin" },
        { name: "Hotel Victoria Lublin", city: "Lublin" },
        { name: "Szkoła Podstawowa nr 12", city: "Lublin" },
        { name: "Delikatesy Czarnecki", city: "Puławy" },
      ],
      items: [
        { text: "Pieczywo – dostawy tygodniowe", rate: "5", min: 400, max: 4200 },
        { text: "Ciasta i wyroby cukiernicze", rate: "8", min: 200, max: 2600 },
        { text: "Catering – przerwa kawowa", rate: "8", min: 600, max: 3100 },
        { text: "Torby i opakowania", rate: "23", min: 40, max: 260 },
      ],
    },
    purchase: {
      count: 12,
      parties: [
        { name: "Młyn Zbożowy Lubelszczyzna", city: "Kraśnik" },
        { name: "Spółdzielnia Mleczarska Ryki", city: "Ryki" },
        { name: "Energa Wschód Sp. z o.o.", city: "Lublin" },
        { name: "Opakowania Eko-Pak", city: "Zamość" },
      ],
      items: [
        { text: "Mąka pszenna i żytnia", rate: "5", min: 1800, max: 7400 },
        { text: "Nabiał i masło", rate: "5", min: 600, max: 2800 },
        { text: "Energia elektryczna", rate: "23", min: 1400, max: 3900 },
        { text: "Opakowania papierowe", rate: "23", min: 300, max: 1500 },
      ],
    },
  },
  ogrod: {
    sales: {
      prefix: "F",
      count: 14,
      parties: [
        { name: "Wspólnota Mieszkaniowa Zabłocie 7", city: "Kraków" },
        { name: "Osiedle Słoneczne Sp. z o.o.", city: "Wieliczka" },
        { name: "Dom Weselny Pod Wawelem", city: "Kraków" },
        { name: "Jan Pawlak – klient indywidualny", city: "Kraków" },
      ],
      items: [
        { text: "Pielęgnacja terenów zielonych", rate: "8", min: 900, max: 6400 },
        { text: "Sadzonki i rośliny ozdobne", rate: "8", min: 150, max: 2200 },
        { text: "Projekt ogrodu", rate: "23", min: 1500, max: 5200 },
      ],
    },
    purchase: {
      count: 9,
      parties: [
        { name: "Szkółka Roślin Zieleniec", city: "Tarnów" },
        { name: "Hurtownia Narzędzi Ogrodnik", city: "Bochnia" },
        { name: "Stacja Paliw Wiśniewski", city: "Kraków" },
      ],
      items: [
        { text: "Sadzonki – zakup hurtowy", rate: "8", min: 400, max: 3600 },
        { text: "Narzędzia i nawozy", rate: "23", min: 200, max: 2800 },
        { text: "Paliwo – kosiarki i auto", rate: "23", min: 150, max: 700, gtu: "GTU_02" },
      ],
    },
  },
  medica: {
    sales: {
      prefix: "FV",
      count: 22,
      parties: [
        { name: "Narodowy Fundusz Zdrowia – OW Poznań", city: "Poznań" },
        { name: "Firma Budowlana Grabowski", city: "Luboń" },
        { name: "PZU Zdrowie – pakiety", city: "Warszawa" },
        { name: "Agnieszka Zając – pacjent", city: "Poznań" },
        { name: "Przedszkole Kolorowe", city: "Poznań" },
      ],
      items: [
        { text: "Usługi medyczne – konsultacje", rate: "zw", min: 300, max: 9800 },
        { text: "Badania okresowe pracowników", rate: "zw", min: 600, max: 5400 },
        { text: "Wynajem gabinetu", rate: "23", min: 1200, max: 2400 },
        { text: "Opinie lekarskie (do celów pozamedycznych)", rate: "23", min: 150, max: 900 },
      ],
    },
    purchase: {
      count: 11,
      parties: [
        { name: "Hurtownia Medyczna Salus", city: "Poznań" },
        { name: "Laboratorium Diagnostyczne Vita", city: "Poznań" },
        { name: "Sprzątanie Lśniąco Sp. z o.o.", city: "Poznań" },
      ],
      items: [
        { text: "Materiały medyczne jednorazowe", rate: "8", min: 400, max: 3200 },
        { text: "Badania laboratoryjne", rate: "zw", min: 600, max: 4800 },
        { text: "Usługi sprzątania", rate: "23", min: 900, max: 2200 },
      ],
    },
  },
};

const partyNipCache = new Map<string, string>();
function nipFor(name: string) {
  let nip = partyNipCache.get(name);
  if (!nip) {
    nip = makeNip(mulberry32(hash(name)));
    partyNipCache.set(name, nip);
  }
  return nip;
}

const pad = (n: number, l = 2) => String(n).padStart(l, "0");
const hex = (rand: () => number, len: number) =>
  Array.from({ length: len }, () => "0123456789ABCDEF"[Math.floor(rand() * 16)]).join("");

export function generateEntries(companyId: string, companyNip: string, register: RegisterKind, year: number, month: number): RegisterEntry[] {
  const [ty, tm, td] = TODAY.split("-").map(Number);
  const isFuture = year > ty || (year === ty && month > tm);
  if (isFuture) return [];
  const isCurrent = year === ty && month === tm;
  const lastDay = isCurrent ? td : new Date(year, month, 0).getDate();

  const profile = profiles[companyId][register];
  const salesPrefix = profiles[companyId].sales.prefix;
  const rand = mulberry32(hash(`${companyId}-${register}-${year}-${month}`));
  const variance = isCurrent ? 0 : Math.floor(rand() * 7) - 3;
  const count = Math.max(4, profile.count + variance);

  const out: RegisterEntry[] = [];
  for (let i = 0; i < count; i++) {
    const pi = Math.floor(rand() * profile.parties.length);
    const party = profile.parties[pi];
    const itemRoll = rand();
    const item =
      register === "purchase" || itemRoll < 0.5
        ? profile.items[pi % profile.items.length]
        : profile.items[Math.floor(rand() * profile.items.length)];
    const day = 1 + Math.floor(rand() * lastDay);
    const issueDate = `${year}-${pad(month)}-${pad(day)}`;
    const roll = rand();
    let docType: DocType = "invoice";
    if (register === "sales" && profiles[companyId].sales.receipts && roll < 0.15) docType = "receipt";
    else if (roll > 0.94) docType = "correction";
    else if (roll > 0.9 && register === "sales") docType = "advance";

    let net = round2(item.min + rand() * (item.max - item.min));
    net = Math.round(net / (net > 1000 ? 10 : 1)) * (net > 1000 ? 10 : 1) + (rand() > 0.5 ? 0 : round2(rand()));
    net = round2(net);
    if (docType === "correction") net = -round2(net * 0.2);
    const { vat, gross } = computeVat(net, item.rate);

    const buyerNip = nipFor(party.name);
    let ksefStatus: KsefStatus = "accepted";
    if (docType === "receipt") ksefStatus = "outside";
    else if (isCurrent && register === "sales" && day >= td - 2) {
      ksefStatus = "not_sent";
    } else if (isCurrent && register === "purchase") {
      if (rand() < 0.12) ksefStatus = "outside";
    }

    const issuerNip = register === "sales" ? companyNip : buyerNip;
    const acceptDay = Math.min(day + 1, lastDay);
    const ksefNumber =
      ksefStatus === "accepted" ? `${issuerNip}-${year}${pad(month)}${pad(acceptDay)}-${hex(rand, 12)}-${hex(rand, 2)}` : undefined;
    const acceptedAt =
      ksefStatus === "accepted" ? `${year}-${pad(month)}-${pad(acceptDay)}T${pad(8 + Math.floor(rand() * 9))}:${pad(Math.floor(rand() * 60))}:${pad(Math.floor(rand() * 60))}` : undefined;

    const number =
      register === "sales"
        ? docType === "receipt"
          ? `PAR/${pad(month)}/${pad(i + 1, 4)}`
          : `${salesPrefix}/${year}/${pad(month)}/${pad(i + 1, 3)}`
        : [
            `F/${pad(month)}/${year}/${Math.floor(rand() * 9000) + 1000}`,
            `FS ${Math.floor(rand() * 900) + 100}/${pad(month)}/${year}`,
            `${year}/${pad(month)}/${pad(Math.floor(rand() * 900) + 10, 5)}`,
          ][Math.floor(rand() * 3)];

    const jpkCodes: string[] = [];
    if (item.gtu) jpkCodes.push(item.gtu);
    if (gross > 15000 && item.rate === "23") jpkCodes.push("MPP");
    if (docType === "receipt") jpkCodes.push("RO");

    out.push({
      id: `${companyId}-${register}-${year}${pad(month)}-${pad(i + 1, 3)}`,
      identifier: `${register === "sales" ? "RS" : "RZ"}/${pad(month)}/${pad(i + 1, 3)}`,
      register,
      docType,
      number,
      series: "",
      issueDate,
      saleDate: issueDate,
      counterparty: { name: party.name, nip: buyerNip, city: party.city },
      description: docType === "correction" ? `Korekta: ${item.text.toLowerCase()}` : item.text,
      vatRate: item.rate,
      net,
      vat,
      gross,
      ksef: { status: ksefStatus, number: ksefNumber, acceptedAt },
      jpkCodes,
    });
  }
  out.sort((a, b) => a.issueDate.localeCompare(b.issueDate) || a.id.localeCompare(b.id));
  // numbering follows date order, like in a real register
  const seq: Record<string, number> = {};
  out.forEach((e, i) => {
    e.identifier = `${register === "sales" ? "RS" : "RZ"}/${pad(month)}/${pad(i + 1, 3)}`;
    if (register === "sales") {
      const prefix = e.docType === "receipt" ? "PAR" : e.docType === "correction" ? "KOR" : e.docType === "advance" ? "FZAL" : salesPrefix;
      seq[prefix] = (seq[prefix] ?? 0) + 1;
      e.number = e.docType === "receipt" ? `PAR/${pad(month)}/${pad(seq[prefix], 4)}` : `${prefix}/${year}/${pad(month)}/${pad(seq[prefix], 3)}`;
    }
    e.series = seriesOf(e.number);
  });
  if (isCurrent && register === "sales") {
    // a realistic handful of documents that need the accountant's attention
    const candidates = out.filter((e) => e.ksef.status === "accepted");
    const pick = () => candidates.splice(Math.floor(rand() * candidates.length), 1)[0];
    const sentAt = `${year}-${pad(month)}-${pad(td - 2)}T09:12:00`;
    const nipError = pick();
    if (nipError) nipError.ksef = { status: "rejected", sentAt, error: { code: "NIP_NABYWCY" } };
    const schemaError = pick();
    if (schemaError) schemaError.ksef = { status: "rejected", sentAt, error: { code: "SCHEMAT_FA3", field: "P_7 (opis towaru lub usługi)" } };
    const queued = pick();
    if (queued) queued.ksef = { status: "queued", sentAt: `${TODAY}T08:40:00` };
  }
  return out;
}
