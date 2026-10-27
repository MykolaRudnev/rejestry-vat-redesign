import type { DocType, KsefStatus, RegisterKind, VatRate } from "./types";

export const registerLabel: Record<RegisterKind, string> = {
  sales: "Sprzedaż",
  purchase: "Zakupy",
};

export const registerLongLabel: Record<RegisterKind, string> = {
  sales: "Rejestr VAT sprzedaży",
  purchase: "Rejestr VAT zakupów",
};

export const docTypeLabel: Record<DocType, string> = {
  invoice: "Faktura",
  correction: "Korekta",
  advance: "Faktura zaliczkowa",
  receipt: "Paragon z NIP",
};

export const ksefLabel: Record<KsefStatus, string> = {
  not_sent: "Nie wysłana",
  queued: "W kolejce",
  processing: "Przetwarzanie",
  accepted: "Przyjęta",
  rejected: "Odrzucona",
  outside: "Poza KSeF",
};

export const vatRateLabel: Record<VatRate, string> = {
  "23": "23%",
  "8": "8%",
  "5": "5%",
  "0": "0%",
  zw: "zw.",
  np: "np",
};

export const vatRates: VatRate[] = ["23", "8", "5", "0", "zw", "np"];
export const docTypes: DocType[] = ["invoice", "correction", "advance", "receipt"];
export const ksefStatuses: KsefStatus[] = ["not_sent", "queued", "processing", "accepted", "rejected", "outside"];

/** JPK_V7 markers offered in filters and "Oznacz kodami JPK" (GTU groups + procedures). */
export const jpkCodeOptions = {
  gtu: ["GTU_01", "GTU_02", "GTU_03", "GTU_04", "GTU_05", "GTU_06", "GTU_07", "GTU_08", "GTU_09", "GTU_10", "GTU_11", "GTU_12", "GTU_13"],
  procedures: ["MPP", "TP", "TT_D", "WSTO_EE", "RO", "FP"],
};

export const monthNames = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];
/** Locative/genitive form, e.g. "w październiku" */
export const monthLocative = [
  "styczniu", "lutym", "marcu", "kwietniu", "maju", "czerwcu",
  "lipcu", "sierpniu", "wrześniu", "październiku", "listopadzie", "grudniu",
];
export const monthShort = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

export function documentsCount(n: number) {
  return `${n}\u00a0${plural(n, "dokument", "dokumenty", "dokumentów")}`;
}

/** Numbering series = letters before the first "/" or space; purchase numbers without a prefix are "inne". */
export function seriesOf(number: string) {
  const m = number.match(/^([A-ZĄĆĘŁŃÓŚŹŻ]{1,6})[\/ ]/i);
  return m ? m[1].toUpperCase() : "Inne";
}
