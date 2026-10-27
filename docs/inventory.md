# Inventory: reference → new UI

Sources: `refs/img.png` (A, the "Obszary księgowe" landing screen with the app shell) and `refs/img_1.png` (B, the "Rejestry i VAT" register).
Status values: **mapped** means it has a place in the new UI. **interpretation** means its meaning isn't certain from the screenshot; the assumption is written next to it.
Places below are implemented (final check 27.10.2026); the IA and flows are described in `docs/REDESIGN-PLAN.md`.

## A — App shell and "Obszary księgowe"
| # | Reference element | New location | Status |
|---|---|---|---|
| A1 | "Witaj, Preview Reviewer!" greeting | User menu header + first line on the overview of areas | mapped |
| A2 | Theme toggle (sun icon) | User menu → Motyw: jasny / ciemny / systemowy; ⌘K | mapped |
| A3 | Notifications bell, badge "4" | Bell → notifications popover/drawer (JPK deadline, KSeF rejections, period to confirm, KSeF session) | mapped |
| A4 | "Preview Reviewer / Konto użytkownika", avatar, chevron | Sidebar footer user menu (avatar on mobile top bar) | mapped |
| A5 | Eyebrow "Ewidencje", title "Obszary księgowe", subtitle | Company switcher popover → "Obszary księgowe" section | mapped |
| A6 | Banner "To jest mapa zakresu… Dane pozostają demonstracyjne." | Demo switcher label "Dane demonstracyjne" (one place for every demo disclaimer) | mapped |
| A7 | Card "Okres księgowy · 2026", description, badge "Wymaga konfiguracji" | Period picker: year header with status "Rok wymaga konfiguracji"; status line | mapped |
| A8 | "Dostępność obszarów" + description | Company switcher popover → readiness list | mapped |
| A9 | Area accordions: Rejestr VAT, KPiR, Ewidencja przychodów, Pełne księgi, Majątek, Kontrole (expandable) | Readiness list rows with status; expanding shows conditions | mapped |
| A10 | "Obszary" tabs: Rejestry i VAT, Księgowania, Majątek, Kontrole | Sidebar nav (desktop) / bottom nav (mobile); non-VAT areas → "poza prototypem" toast | mapped |

## B — "Rejestry i VAT"
| # | Reference element | New location | Status |
|---|---|---|---|
| B1 | Company "Onsaldo Preview Sp. z o.o." above title | Company switcher (multi-company office) + eyebrow | mapped |
| B2 | Title "Rejestry i VAT" | Page title | mapped |
| B3 | Subtitle "Sprzedaż i zakupy w wybranym okresie — podgląd…" | Dropped as redundant: the tabs and the period say this | mapped |
| B4 | Badge "Wymaga potwierdzenia" | Period status line "Wymaga potwierdzenia · Potwierdź okres" | mapped |
| B5 | Badge "DEMO" | Demo switcher | mapped |
| B6 | Tabs "Rejestr VAT sprzedaży" / "Rejestr VAT zakupów" | Tabs "Sprzedaż / Zakupy" with counts (full names in aria/title) | mapped |
| B7 | Banner "Kontekst VAT wymaga potwierdzenia. Poniżej wyłącznie dane demonstracyjne…" | Status line (confirmation) + Demo switcher (demo data) | mapped |
| B8 | Search "Szukaj" | Search: counterparty, NIP, number, KSeF no., identifier | mapped |
| B9 | Toolbar icon: tag | ⋯ → "Oznacz kodami JPK…" and the selection bar (assign GTU/procedure codes to checked documents) | interpretation |
| B10 | Toolbar icon: print | ⋯ → Drukuj rejestr; detail → Drukuj dokument | mapped |
| B11 | Toolbar icon: download (↓) | ⋯ → Eksportuj do CSV; JPK_V7M XML from ⋯ → Podgląd JPK / "Zamknij okres" | interpretation (export) |
| B12 | Toolbar icon: sliders (show/hide filter panel) | "Filtry" button → filters sheet | mapped |
| B13 | Filter: Rok | Period picker (year) | mapped |
| B14 | Filter: Miesiąc | Period picker (month stepper + month grid) | mapped |
| B15 | Filter: Rodzaj operacji (Wszystkie) | Filters sheet → Rodzaj operacji (Faktura, Korekta, Zaliczka, Paragon z NIP, WDT/eksport…) | mapped |
| B16 | Filter: Kod JPK V7 (Wszystkie) | Filters sheet → Kod JPK V7 (GTU_01…13, procedures TP, MPP…) | mapped |
| B17 | Button "Serie dokumentów" | Filters sheet → Serie dokumentów (FV, KOR, FZ, PAR…) | mapped |
| B18 | Reset filters icon | "Wyczyść" in sheet + "Wyczyść wszystko" after chips | mapped |
| B19 | Tiles Netto / VAT / Brutto | Summary: register totals line (Netto · VAT · Brutto) under the VAT hero | mapped |
| B20 | "Kwoty według stawek VAT" with bars 23% / np and amounts | Segmented rate bar + legend (all rates incl. np), details on tap | mapped |
| B21 | Column Kontrahent (sortable, draggable) | Table column (name + NIP) / list title | mapped |
| B22 | Column Data (sortable, draggable) | Table column / list day groups | mapped |
| B23 | Column Numer dokumentu (sortable, draggable) | Table column (+ document type) | mapped |
| B24 | Column Numer KSeF, pill "Brak potwierdzenia" | KSeF column: status + number; "Brak potwierdzenia" kept as the no-number text | mapped |
| B25 | Column Identyfikator (e.g. DEMO-S-1) | Table column (secondary, can be hidden) + detail | mapped |
| B26 | Column drag handles (reorder) | ⋯ → Kolumny: visibility + reorder (drag and ↑/↓ buttons) | mapped |
| B27 | Column sort arrows | Sortable headers; Sort menu on mobile | mapped |
| B28 | Row chevron (expand row) | Row opens detail panel (desktop) / drawer (mobile); row ⋯ for quick actions | mapped |
| B29 | "1–10 z 14 zapisów" | Table footer range | mapped |
| B30 | Pager ‹ 1/2 › | Footer pager (desktop), load more (phone) | mapped |
| B31 | "10 na stronie" | Page size 10/25/50 | mapped |

## Domain behaviour that is required, not new features
- Confirm period: locks the period as read-only. Checklist before confirming.
- JPK_V7M status per month (to send, sent with UPO, future), JPK preview and export.
- KSeF per-invoice flow:
  - not sent → queued → processing → accepted (KSeF number, UPO) or rejected (code, reason, how to fix);
  - resend; bulk send; UPO preview.
- Add and edit document with validation (NIP checksum, amounts, duplicates). Delete with undo.
- VAT do zapłaty = należny − naliczony.
