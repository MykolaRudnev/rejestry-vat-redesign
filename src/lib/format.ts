import { monthNames, monthShort } from "./labels.ts";

const money = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

const number = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

/** 12 345,67 zł */
export function formatMoney(value: number) {
  return money.format(value);
}

/** 12 345,67 (no currency) */
export function formatAmount(value: number) {
  return number.format(value);
}

/**
 * Splits an amount into integer and decimal parts for typographic emphasis.
 * Thousands use a narrow no-break space (U+202F), the sign is a true minus (U+2212).
 */
export function splitMoney(value: number) {
  const s = number.format(Math.abs(value)).replace(/[\s\u00a0]/g, "\u202f");
  const i = s.lastIndexOf(",");
  return { sign: value < 0 ? "\u2212" : "", int: s.slice(0, i), dec: s.slice(i + 1) };
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 12.10.2026 */
export function formatDate(iso: string) {
  const d = parseIso(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/** 12 paź */
export function formatDateShort(iso: string) {
  const d = parseIso(iso);
  return `${d.getDate()} ${monthShort[d.getMonth()]}`;
}

const weekday = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" });
/** poniedziałek, 12 października */
export function formatDayHeading(iso: string) {
  return weekday.format(parseIso(iso));
}

export function formatPeriod(year: number, month: number) {
  const name = monthNames[month - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

/** 525-234-40-78 */
export function formatNip(nip: string) {
  return nip.replace(/^(\d{3})(\d{3})(\d{2})(\d{2})$/, "$1-$2-$3-$4");
}

/** Parses Polish formatted amounts: "1 234,56" | "1234.56" */
export function parseAmount(input: string): number {
  const cleaned = input.replace(/[\s\u00a0zł]/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((parseIso(toIso).getTime() - parseIso(fromIso).getTime()) / 86_400_000);
}

/** 24.10.2026, 14:02 (from ISO date-time) */
export function formatDateTime(iso: string, seconds = false) {
  const t = iso.slice(11, seconds ? 19 : 16);
  return t ? `${formatDate(iso.slice(0, 10))}, ${t}` : formatDate(iso.slice(0, 10));
}

/** ISO yyyy-mm-dd → dd.mm.rrrr */
export const isoToPl = (iso: string) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "");

/** Accepts "24.10.2026", "24-10-2026", "24/10/26", "24102026"; returns ISO or null. */
export function plToIso(text: string): string | null {
  const t = text.trim();
  let m = t.match(/^(\d{1,2})[.\-/ ](\d{1,2})[.\-/ ](\d{2}|\d{4})$/);
  if (!m) m = t.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

