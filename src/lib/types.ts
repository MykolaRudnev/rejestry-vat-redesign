export type RegisterKind = "sales" | "purchase";

export type DocType = "invoice" | "correction" | "advance" | "receipt";

/** "np" = nie podlega (e.g. services taxed outside Poland). */
export type VatRate = "23" | "8" | "5" | "0" | "zw" | "np";

/** Status of the document in KSeF (Krajowy System e-Faktur). */
export type KsefStatus =
  | "not_sent" // nie wysłana (kolumna pokazuje „Brak potwierdzenia”)
  | "queued" // w kolejce do wysyłki
  | "processing" // KSeF weryfikuje fakturę
  | "accepted" // przyjęta, ma numer KSeF i UPO
  | "rejected" // odrzucona, z kodem błędu
  | "outside"; // poza KSeF (np. paragon, faktura zagraniczna)

/** Demo error catalogue (docs/REDESIGN-PLAN.md §5); real KSeF codes come from the API later. */
export type KsefErrorCode = "NIP_NABYWCY" | "DUPLIKAT" | "SCHEMAT_FA3" | "DATA_PRZYSZLA" | "SESJA_WYGASLA";

export interface KsefState {
  status: KsefStatus;
  number?: string;
  /** ISO date-time of acceptance */
  acceptedAt?: string;
  /** ISO date-time of the last send attempt */
  sentAt?: string;
  error?: { code: KsefErrorCode; field?: string; detail?: string };
}

export interface Counterparty {
  name: string;
  nip: string;
  city: string;
}

export interface RegisterEntry {
  id: string;
  /** Internal register identifier, e.g. RS/10/007 (column „Identyfikator”). */
  identifier: string;
  register: RegisterKind;
  docType: DocType;
  number: string;
  /** Numbering series (prefix of the number), e.g. FV, KOR, PAR — filter "Serie dokumentów" [B17]. */
  series: string;
  issueDate: string; // ISO yyyy-mm-dd
  saleDate: string; // ISO
  counterparty: Counterparty;
  description: string;
  vatRate: VatRate;
  net: number;
  vat: number;
  gross: number;
  ksef: KsefState;
  /** JPK_V7 markers (GTU / procedure codes). */
  jpkCodes: string[];
}

export interface Company {
  id: string;
  name: string;
  shortName: string;
  nip: string;
  city: string;
  /** Rozliczenie VAT: miesięczne (JPK_V7M) */
  vatScheme: "V7M" | "V7K";
}

export interface Period {
  year: number;
  month: number; // 1-12
}

export interface PeriodInfo extends Period {
  confirmed: boolean;
  confirmedAt?: string;
  jpkStatus: "sent" | "due" | "future";
  jpkSentAt?: string;
  jpkDeadline: string; // ISO
}

export interface RegisterResponse {
  entries: RegisterEntry[];
  /** Both registers for the period – needed for "VAT do zapłaty". */
  vatDue: { output: number; input: number };
  counts: Record<RegisterKind, number>;
  /** KSeF problems in the sales register — shown above the tabs, so independent of the open tab. */
  ksefIssues: { rejected: number; notSent: number };
  period: PeriodInfo;
}

export type DemoState = "filled" | "empty" | "error" | "loading";

export interface Filters {
  q: string;
  /** Rodzaj operacji [B15] */
  docTypes: DocType[];
  ksef: KsefStatus[];
  rates: VatRate[];
  /** Kod JPK V7: GTU / procedure markers [B16] */
  jpk: string[];
  /** Serie dokumentów [B17] */
  series: string[];
}

export const emptyFilters: Filters = {
  q: "",
  docTypes: [],
  ksef: [],
  rates: [],
  jpk: [],
  series: [],
};

export type EntryDraft = Omit<RegisterEntry, "id" | "identifier" | "series" | "vat" | "gross" | "ksef" | "jpkCodes"> & {
  jpkCodes?: string[];
};
