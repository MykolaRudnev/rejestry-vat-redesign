import type { KsefErrorCode, KsefStatus, RegisterEntry } from "./types";
import { formatDate, formatNip } from "./format";

/** Form field a rejection points at — "Popraw dane" opens the form focused there. */
export type FixField = "nip" | "number" | "issueDate" | "description";

export interface KsefErrorInfo {
  title: string;
  why: (e: RegisterEntry) => string;
  what: string;
  action: "fix" | "renew";
  field?: FixField;
}

/** Error catalogue, copy from docs/REDESIGN-PLAN.md §5. */
export const ksefErrors: Record<KsefErrorCode, KsefErrorInfo> = {
  NIP_NABYWCY: {
    title: "Niepoprawny NIP nabywcy",
    why: (e) => `KSeF nie znalazł podmiotu o NIP ${formatNip(e.counterparty.nip).replaceAll("-", "\u2011")}.`,
    what: "Sprawdź NIP na fakturze i popraw go. Po zapisie wyślemy fakturę ponownie.",
    action: "fix",
    field: "nip",
  },
  DUPLIKAT: {
    title: "Faktura już jest w KSeF",
    why: (e) => `Faktura o numerze ${e.number} od tego sprzedawcy została już przyjęta.`,
    what: "Jeśli to ta sama faktura, usuń duplikat z rejestru. Jeśli inna, nadaj jej nowy numer.",
    action: "fix",
    field: "number",
  },
  SCHEMAT_FA3: {
    title: "Błąd struktury FA(3)",
    why: (e) => `Pole ${e.ksef.error?.field ?? "P_7 (opis towaru lub usługi)"} nie spełnia wymagań schematu FA(3).`,
    what: "Uzupełnij lub popraw wskazane pole. Pozostałe dane są poprawne.",
    action: "fix",
    field: "description",
  },
  DATA_PRZYSZLA: {
    title: "Data wystawienia z przyszłości",
    why: (e) => `Data ${formatDate(e.issueDate)} jest późniejsza niż dzisiejsza. KSeF przyjmuje faktury wystawione najpóźniej dziś.`,
    what: "Zmień datę wystawienia albo wyślij fakturę w dniu jej wystawienia.",
    action: "fix",
    field: "issueDate",
  },
  SESJA_WYGASLA: {
    title: "Sesja KSeF wygasła",
    why: () => "Token autoryzacyjny stracił ważność, więc faktura nie została wysłana.",
    what: "Odnów połączenie z KSeF i wyślij ponownie. Dane faktury są poprawne.",
    action: "renew",
  },
};

/** One-line explanation per status for the detail panel. */
export const ksefStatusLine: Record<KsefStatus, string> = {
  not_sent: "Faktura nie została jeszcze wysłana do KSeF.",
  queued: "Czeka na wysłanie. Możesz zamknąć to okno.",
  processing: "KSeF weryfikuje fakturę. Status odświeży się sam.",
  accepted: "Numer KSeF nadany.",
  rejected: "KSeF odrzucił fakturę.",
  outside: "Dokument nie podlega KSeF (np. paragon, faktura zagraniczna).",
};

export const isInFlight = (s: KsefStatus) => s === "queued" || s === "processing";
export const needsAttention = (s: KsefStatus) => s === "rejected" || s === "not_sent";
/** Sales documents that can be (re)sent: never sent or rejected. */
export const canSendKsef = (e: RegisterEntry) => e.register === "sales" && needsAttention(e.ksef.status);

/** The error to explain, if any: a KSeF rejection, or a send that never left (expired session → still "not_sent"). */
export const ksefProblem = (e: RegisterEntry) => (needsAttention(e.ksef.status) && e.ksef.error ? ksefErrors[e.ksef.error.code] : null);
