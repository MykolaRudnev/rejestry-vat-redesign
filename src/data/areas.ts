/** "Dostępność obszarów" from the original landing screen (A8/A9). Demo readiness data. */
export type Readiness = "ready" | "config" | "unavailable";

export interface Area {
  id: string;
  name: string;
  readiness: Readiness;
  conditions: { label: string; ok: boolean }[];
}

export const areas: Area[] = [
  {
    id: "vat",
    name: "Rejestr VAT",
    readiness: "ready",
    conditions: [
      { label: "Firma jest czynnym podatnikiem VAT", ok: true },
      { label: "Połączenie z KSeF aktywne", ok: true },
      { label: "Rozliczenie JPK_V7 ustawione", ok: true },
    ],
  },
  {
    id: "kpir",
    name: "KPiR",
    readiness: "unavailable",
    conditions: [{ label: "KPiR nie dotyczy tej firmy — prowadzi pełne księgi", ok: false }],
  },
  {
    id: "income",
    name: "Ewidencja przychodów",
    readiness: "unavailable",
    conditions: [{ label: "Ewidencja przychodów nie dotyczy — firma nie jest na ryczałcie", ok: false }],
  },
  {
    id: "books",
    name: "Pełne księgi",
    readiness: "config",
    conditions: [
      { label: "Plan kont zaimportowany", ok: true },
      { label: "Wprowadź bilans otwarcia 2026", ok: false },
    ],
  },
  {
    id: "assets",
    name: "Majątek",
    readiness: "config",
    conditions: [
      { label: "Ewidencja środków trwałych utworzona", ok: true },
      { label: "Wybierz metodę amortyzacji", ok: false },
    ],
  },
  {
    id: "checks",
    name: "Kontrole",
    readiness: "ready",
    conditions: [{ label: "Reguły kontroli VAT włączone", ok: true }],
  },
];

export const readinessLabel: Record<Readiness, string> = {
  ready: "Gotowy",
  config: "Wymaga konfiguracji",
  unavailable: "Niedostępny",
};
