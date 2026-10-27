import type { Company, RegisterEntry, RegisterKind } from "./types";
import { docTypeLabel, ksefLabel, registerLongLabel, vatRateLabel } from "./labels";
import { formatAmount, formatDate } from "./format";

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCsv(entries: RegisterEntry[], company: Company, register: RegisterKind, year: number, month: number) {
  const head = ["Identyfikator", "Data", "Numer dokumentu", "Rodzaj", "Kontrahent", "NIP", "Stawka", "Netto", "VAT", "Brutto", "Status KSeF", "Numer KSeF", "Oznaczenia JPK"];
  const rows = entries.map((e) => [
    e.identifier, formatDate(e.issueDate), e.number, docTypeLabel[e.docType], e.counterparty.name, e.counterparty.nip,
    vatRateLabel[e.vatRate], formatAmount(e.net), formatAmount(e.vat), formatAmount(e.gross),
    ksefLabel[e.ksef.status], e.ksef.number ?? "", e.jpkCodes.join(" "),
  ]);
  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const csv = "\uFEFF" + [head, ...rows].map((r) => r.map((c) => esc(String(c))).join(";")).join("\r\n");
  const slug = registerLongLabel[register].toLowerCase().replaceAll(" ", "-");
  download(`${company.shortName.replaceAll(" ", "_")}_${slug}_${year}-${String(month).padStart(2, "0")}.csv`, csv, "text/csv;charset=utf-8");
}

/** JPK_V7M preview XML (declaration part only) — a demo file, not for submission. */
export function exportJpk(company: Company, year: number, month: number, fields: { code: string; value: number }[]) {
  const body = fields.map((f) => `    <${f.code}>${Math.round(f.value)}</${f.code}>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Prototyp: podgląd JPK_V7M(2), część deklaracyjna, nie do wysyłki -->
<JPK>
  <Naglowek><KodFormularza kodSystemowy="JPK_V7M (2)">JPK_VAT</KodFormularza><Rok>${year}</Rok><Miesiac>${month}</Miesiac></Naglowek>
  <Podmiot1><NIP>${company.nip}</NIP><PelnaNazwa>${company.name}</PelnaNazwa></Podmiot1>
  <Deklaracja><PozycjeSzczegolowe>
${body}
  </PozycjeSzczegolowe></Deklaracja>
</JPK>
`;
  download(`JPK_V7M_${company.nip}_${year}-${String(month).padStart(2, "0")}.xml`, xml, "application/xml");
}
