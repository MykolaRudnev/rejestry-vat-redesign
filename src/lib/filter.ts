import type { Filters, RegisterEntry, VatRate } from "./types";
import { vatRates } from "./labels";
import { round2 } from "./vat";

export function applyFilters(entries: RegisterEntry[], f: Filters) {
  const q = f.q.trim().toLowerCase();
  const qDigits = q.replace(/[\s-]/g, "");
  return entries.filter((e) => {
    if (f.docTypes.length && !f.docTypes.includes(e.docType)) return false;
    if (f.ksef.length && !f.ksef.includes(e.ksef.status)) return false;
    if (f.rates.length && !f.rates.includes(e.vatRate)) return false;
    if (f.jpk.length && !f.jpk.some((c) => e.jpkCodes.includes(c))) return false;
    if (f.series.length && !f.series.includes(e.series)) return false;
    if (q) {
      const hay = [e.number, e.counterparty.name, e.counterparty.city, e.description, e.identifier, e.ksef.number ?? "", e.jpkCodes.join(" ")]
        .join(" ")
        .toLowerCase();
      const nipHit = /^\d{3,}$/.test(qDigits) && e.counterparty.nip.includes(qDigits);
      if (!hay.includes(q) && !nipHit) return false;
    }
    return true;
  });
}

export function activeFilterCount(f: Filters) {
  return f.docTypes.length + f.ksef.length + f.rates.length + f.jpk.length + f.series.length;
}

export function totals(entries: RegisterEntry[]) {
  const t = { net: 0, vat: 0, gross: 0 };
  const byRate = Object.fromEntries(vatRates.map((r) => [r, { net: 0, vat: 0 }])) as Record<VatRate, { net: number; vat: number }>;
  for (const e of entries) {
    t.net += e.net;
    t.vat += e.vat;
    t.gross += e.gross;
    byRate[e.vatRate].net += e.net;
    byRate[e.vatRate].vat += e.vat;
  }
  for (const r of vatRates) {
    byRate[r].net = round2(byRate[r].net);
    byRate[r].vat = round2(byRate[r].vat);
  }
  return { net: round2(t.net), vat: round2(t.vat), gross: round2(t.gross), byRate };
}
