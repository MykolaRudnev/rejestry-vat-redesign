# Saldo: redesign plan for "Rejestry i VAT"

Owner: design lead. Status: v1, **for the owner's review before any code**.
- Visual rules: `docs/design-system.md` (DS).
- Field coverage: `docs/inventory.md`. IDs A1–A10 and B1–B31 are cited in brackets.

**The page answers three questions, top to bottom:**
1. Where am I? The company and the period.
2. What does the period owe, and what needs me? "VAT do zapłaty" and the attention line.
3. Which documents are there? The register.

Everything else sits behind one named action. Glyphs in the wireframes (🔔 ⚗ ⛔ 📅 ✓ ⚠) stand for lucide icons, never emoji.

## Boldest changes vs. the baseline
1. **The period is the headline.** On the phone, the period title ("Październik 2026 ▾") replaces the page title. The hero is **VAT do zapłaty for the whole period**, above the tabs. The register's Netto · VAT · Brutto become a quiet line under the tabs (B19).
2. **"Zamknij okres" is one guided sheet** in three steps: *Sprawdź → Potwierdź → JPK*. This replaces the scattered "Potwierdź" link, the JPK preview in ⋯, and the badges B4/B7.
3. **The KSeF triage sheet "Do wyjaśnienia"** shows one problem at a time: reason, what to do, the fix button, then "Następna". It replaces the baseline's red row edges and the hunt through the detail.
4. **Landing screen A dissolves into the company switcher.** Company, accounting year (A7) and *Dostępność obszarów* (A8/A9) live together in "Obszary i dostępność" (A5).
5. **Status by exception.** Healthy rows are quiet text; only queued/processing/rejected get pills. The demo disclaimers (A6/B5/B7) collapse into one "Dane demonstracyjne" control.

---

## 1. IA tree

```
Shell
├─ Sidebar (≥1024) · rail (768–1023) · top bar + bottom nav (<768)
│  ├─ Company switcher [B1] ─ popover: companies, search · "Obszary i dostępność" → sheet [A5 A7 A8 A9]
│  ├─ ⌘K "Szukaj i działaj" (all actions, periods, companies, documents)
│  ├─ Areas nav [A10]: Rejestry i VAT · Księgowania · Majątek · Kontrole (non-VAT → toast "Poza prototypem")
│  ├─ Notifications bell + count [A3] → popover / drawer
│  ├─ User menu [A1 A2 A4]: Witaj…, Motyw, Skróty, Wyloguj
│  └─ "Dane demonstracyjne" [A6 B5 B7] → state switcher
└─ Rejestry i VAT [B2]
   ├─ Period header: eyebrow company [B1] · title · period stepper + month grid [B13 B14 A7] · status line [B4]
   │   └─ "Zamknij okres" sheet: Sprawdź → Potwierdź → JPK preview/export
   ├─ Summary: VAT do zapłaty (hero) · należny · naliczony
   ├─ Attention line (only if problems) → "Do wyjaśnienia" KSeF triage sheet
   └─ Register
      ├─ Tabs Sprzedaż n / Zakupy n [B6]
      ├─ Register totals Netto · VAT · Brutto [B19] · rate bar + legend [B20]
      ├─ Toolbar: Search [B8] · Filtry (n) [B12] · ⋯ [B9 B10 B11 B26] · Dodaj dokument
      │   ├─ Filters panel [B15 B16 B17 B18 + Status KSeF, Stawka VAT, Sort on phone B27]
      │   └─ Active chips + "Wyczyść wszystko" [B18]
      ├─ Table (≥768) / day list (<768) [B21–B25 B27 B28]
      ├─ Selection bar (≥1 checked): Wyślij do KSeF · Oznacz kodami JPK [B9] · Eksportuj · Drukuj · Usuń
      ├─ Footer: 1–10 z 14 zapisów [B29] · 10 na stronie [B31] · ‹ 1/2 › [B30]
      └─ Document detail (panel / drawer) [B28]
          ├─ KSeF section → UPO view · problem → fix
          └─ Edit form · Drukuj dokument [B10] · Usuń (undo)
```

## 2. Screens

### 2.1 Register main view

**1440 (filled)**, with the desk on the left and the sheet on the right (DS §5):
```
┌──────────────────────┬───────────────────────────────────────────────────────────────────────────────┐
│ ▣ Saldo              │  Nordwind Software Sp. z o.o.                                                 │
│                      │  Rejestry i VAT                                   ‹  Październik 2026 ▾  ›    │
│ (NS) Nordwind Softw.⌄│  ⚠ Wymaga potwierdzenia · JPK_V7M do 25 listopada (za 30 dni) · Zamknij okres │
│      NIP 584-279-91-30                                                                                │
│                      │  VAT do zapłaty                                                               │
│ ⌕ Szukaj i działaj ⌘K│  45 134,33 zł          należny 48 366,21 zł     naliczony 3 231,88 zł         │
│                      │  ^ text-hero 72                ^ display-3                                    │
│ ▤ Rejestry i VAT     │                                                                               │
│ ⊟ Księgowania        │  ┌ wa-soft ────────────────────────────────────────────────────────────────┐  │
│ ⌂ Majątek            │  │ ⚠ 3 dokumenty do wyjaśnienia w KSeF · 1 odrzucony, 2 w kolejce   Wyjaśnij │  │
│ ✓ Kontrole           │  └─────────────────────────────────────────────────────────────────────────┘  │
│                      │                                                                               │
│                      │  Sprzedaż 24    Zakupy 17                                                     │
│                      │  ━━━━━━━━                                                                     │
│                      │  Netto 226 853,76 · VAT 48 366,21 · Brutto 275 219,97                         │
│                      │  ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▅▃░                     │
│                      │  ● 23% 209 678,05   ● 8% —   ● 5% 2 804,94   ○ zw. 14 370,77   ○ np 0,00      │
│                      │                                                                               │
│                      │  [⌕ Szukaj: kontrahent, NIP, numer, KSeF  /]  [≡ Filtry 2]   ⋯  [+ Dodaj dokument]
│                      │  (Rodzaj: Korekta ✕) (Status KSeF: Odrzucona ✕)  Wyczyść wszystko             │
│                      │                                                                               │
│                      │  ☐ Data ↓  Kontrahent           Numer dokumentu    Numer KSeF        Identyf.  Netto   VAT  Brutto, zł
│                      │  ─────────────────────────────────────────────────────────────────────────────│
│                      │    25 paź  Agencja Kreatywna…   KOR/2026/10/001    (◷ W kolejce)      RS/10/24 −1 910,00 −439,30 −2 349,30
│                      │            NIP 604-051-98-52    Korekta            Brak potwierdzenia                          ⋯
│                      │    24 paź  Klinika Wet. Azor    FV/2026/10/019     ✓ Przyjęta         RS/10/23 36 350,00 …
│                      │            NIP 690-216-22-60    Faktura            5842799130-2026…                            │
│ ──────────────────── │    …                                                                          │
│ 🔔 4                  │  1–10 z 24 zapisów                          10 na stronie ⌄     ‹  1 / 3  ›   │
│ (PR) Preview Reviewer│                                                                               │
│ ⚗ Dane demonstracyjne│                                                                               │
└──────────────────────┴───────────────────────────────────────────────────────────────────────────────┘
```
- The toolbar sticks under the sheet top while the table scrolls (`surface-raised` + `shadow-raised` only once it's stuck).
- Column order is user-set (B26). The default is Data · Kontrahent · Numer dokumentu · Numer KSeF · Identyfikator · Netto · VAT · Brutto.

**375 (filled):**
```
┌───────────────────────────────────┐
│ (NS) Nordwind Software ⌄   🔔4 (PR)│ top bar 52
│                                    │
│ ‹  Październik 2026 ⌄          ›   │ display-1 28 = page title on phone
│ Rejestry i VAT · Nordwind Software │ text-small ink-2
│ ⚠ Wymaga potwierdzenia · do 25.11  │
│                        Zamknij okres│
│                                    │
│ VAT do zapłaty                     │
│ 45 134,33 zł                       │ text-hero 48
│ należny 48 366,21 · naliczony 3 231,88
│                                    │
│ ⚠ 3 do wyjaśnienia w KSeF      ›   │ attention line
│                                    │
│ Sprzedaż 24   Zakupy 17            │ sticky with the next row
│ [⌕ Szukaj            ] [≡ 2] [⋯]   │
│ Netto 226 853,76 · Brutto 275 219,97
│ ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▅▃░   Stawki ⌄ │
│                                    │
│ Pon, 25 października     −439,30   │ sticky day header (day VAT)
│ Agencja Kreatywna Pixelowo −2 349,30
│ KOR/2026/10/001 · Korekta (◷ W kolejce)
│ ────────────────────────────────── │
│ Sob, 24 października               │
│ Klinika Weterynaryjna Azor 44 710,50
│ FV/2026/10/019 · Faktura  ✓ Przyjęta│
│                       [ + Dodaj ]  │ FAB, accent, 56, bottom-right
│ ▤ VAT   ⊟ Księgowania ⌂ Majątek ✓ Kontrole │ bottom nav
└───────────────────────────────────┘
```
- The first list row starts at about 560 px on an iPhone SE.
- Once you scroll past the hero, the top bar shows "Paź 2026 · 45 134,33 zł" so the context stays visible.
- Load more: "Pokaż kolejne 10 (z 24)" at the end of the list (B30 on phone). B31 page size isn't shown on phones.

### 2.2 Filters panel [B12 B15 B16 B17 B18]
- **≥1024:** a popover anchored to "Filtry", 600 px wide, two columns. Filters apply live and the table updates behind it.
- **<768:** a bottom drawer; changes apply on "Pokaż N".
```
1440 popover                                          375 drawer
┌─────────────────────────────────────────────────┐   ┌──────────────────────────────┐
│ Filtry                                 Wyczyść  │   │ ▬                            │
│ Rodzaj operacji          Kod JPK V7             │   │ Filtry               Wyczyść │
│ (Faktura 18)(Korekta 2)  GTU (GTU_02 3)(GTU_07 1)│   │ Sortuj  [Data ↓|Kwota|Kontr.]│
│ (Zaliczka 1)(Paragon 3)  (GTU_12 4)              │   │ Rodzaj operacji  (chips…)    │
│ (WDT / eksport 0)        Procedury (MPP 2)(TP 0) │   │ Status KSeF      (chips…)    │
│ Status KSeF              Stawka VAT              │   │ Kod JPK V7       (chips…)    │
│ (Nie wysłana)(W kolejce) (23%)(8%)(5%)(0%)(zw)(np)│   │ Stawka VAT       (chips…)    │
│ (Przyjęta)(Odrzucona)    Serie dokumentów        │   │ Serie dokumentów (chips…)    │
│ (Poza KSeF)              (FV 20)(KOR 2)(FZ 0)(PAR 2)│ │                              │
│ ─ 12 z 24 dokumentów ─────────────────────────  │   │ [   Pokaż 12 dokumentów    ] │
└─────────────────────────────────────────────────┘   └──────────────────────────────┘
```
- Options with 0 matches are disabled and show "0".
- On 768–1023 the panel is a right-side panel instead of the popover.
- After closing, the active filters show as chips under the toolbar.

### 2.3 Document detail [B21–B25 B28]
- **≥768:** a non-modal right panel, 480 px. ↑/↓ and the ‹ › buttons step through rows, and clicking another row swaps the content.
- **<768:** a 92 dvh drawer.
```
┌ Faktura · FV/2026/10/019            ‹ ›  ✕ ┐
│ Klinika Weterynaryjna Azor                 │ display-2
│ NIP 690-216-22-60 ⧉ · Gdańsk               │
│                                            │
│ Brutto                                     │
│ 44 710,50 zł                               │ display-2 amount
│ Netto 36 350,00 · VAT 23% 8 360,50         │
│                                            │
│ KSeF                                       │ text-title
│ ✓ Przyjęta 24.10.2026, 14:02               │
│ 5842799130-20261024-7A1F…-3C ⧉ (mono)      │
│ Pokaż UPO                                  │ text button
│                                            │
│ Dane dokumentu                             │
│ Data wystawienia     24.10.2026            │ label ink-2 / value ink-1, 2-col grid
│ Data sprzedaży       24.10.2026            │
│ Rodzaj operacji      Faktura               │
│ Seria                FV                    │
│ Identyfikator        RS/10/023             │ [B25]
│ Kod JPK V7           GTU_12 · MPP          │
│ Opis                 Wdrożenie systemu CRM │
├────────────────────────────────────────────┤ sticky footer
│ ⋯ (Drukuj dokument, Usuń)       [Edytuj]   │
└────────────────────────────────────────────┘
```
The primary action follows the KSeF state:

| state | primary | secondary |
|---|---|---|
| not_sent | Wyślij do KSeF | Edytuj |
| rejected | Popraw dane | Wyślij ponownie |
| queued / processing | none (progress line shown) | — |
| accepted | Edytuj is disabled ("Faktura przyjęta w KSeF. Zmiana wymaga korekty.") | Pokaż UPO |

In a confirmed period, everything is read-only and only "Drukuj dokument" remains.

### 2.4 Add / edit form
- **≥768:** right panel, 560 px, with a scrim.
- **<768:** full drawer. The keyboard-safe footer stays pinned.
```
┌ Nowy dokument · Sprzedaż                 ✕ ┐
│ Kontrahent                                 │
│ NIP ▁▁▁▁▁▁▁▁▁▁▁▁▁▁ ✓   Nazwa ▁▁▁▁▁▁▁▁▁▁▁▁▁ │ ledger-line inputs
│ Miasto ▁▁▁▁▁▁▁▁▁                           │
│ Dokument                                   │
│ Rodzaj operacji [Faktura ⌄]  Numer ▁▁▁▁▁▁  │ series derived from the number prefix, shown as a hint
│ Data wystawienia ▁▁.▁▁.▁▁▁▁  Data sprzedaży ▁▁.▁▁.▁▁▁▁
│ ⓘ Data sprzedaży w listopadzie: dokument trafi do okresu 11/2026.
│ Kwoty                                      │
│ Stawka [23% ⌄]   Netto ▁▁▁▁▁▁▁▁ zł         │
│ VAT 8 360,50 zł · Brutto 44 710,50 zł      │ live preview, display-3
│ Kod JPK V7  (GTU_12 ✓)(MPP)(+ dodaj)       │
│ Opis ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁               │
├────────────────────────────────────────────┤
│                    Anuluj   [Zapisz]       │
└────────────────────────────────────────────┘
```
Validation:
- **NIP checksum** is checked on blur.
- **Amounts** use pl-PL parsing.
- **Korekta** may be negative; other types may not.
- **Duplicates** are checked on save (server). The message reads "Dokument FV/2026/10/019 od tego kontrahenta już istnieje" with the link "Otwórz istniejący".
- On error, the first invalid field gets focus and the top of the form shows an error summary.
- **Leaving with unsaved changes** opens the "Odrzucić zmiany?" dialog.

### 2.5 KSeF: "Do wyjaśnienia" triage sheet
Two ways in: the attention line "Wyjaśnij", or the rejected-status filter → "Wyjaśnij wszystkie". It's a right panel or drawer.
```
┌ Do wyjaśnienia w KSeF · 1 z 3            ✕ ┐
│ (⛔ Odrzucona)  FV/2026/10/021             │
│ Hurtownia Mazur Sp. z o.o. · 6 730,00 zł   │
│                                            │
│ Niepoprawny NIP nabywcy                    │ display-3
│ KSeF nie znalazł podmiotu o NIP 934-602-92-37.
│ Co zrobić: sprawdź NIP na fakturze i popraw│
│ go. Po zapisie wyślemy fakturę ponownie.   │
│ Kod błędu: NIP_NABYWCY · 24.10, 09:12      │ text-small ink-3
│                                            │
│ [Popraw dane]   Wyślij ponownie            │
├────────────────────────────────────────────┤
│ ‹ Poprzednia                   Następna ›  │
└────────────────────────────────────────────┘
```
- "Popraw dane" opens the form with the field highlighted (`er-border`) and focused. On save, the document is re-queued, the sheet advances to the next problem, and a toast says "Wysłano ponownie FV/2026/10/021".
- When everything is cleared, the sheet shows "Wszystko wyjaśnione" with "Zamknij".

### 2.6 UPO view
Opened from Detail → "Pokaż UPO". It replaces the panel content and has a back arrow.
```
┌ ← UPO · FV/2026/10/019                   ✕ ┐
│ Urzędowe Poświadczenie Odbioru             │ display-2
│ Numer KSeF      5842799130-20261024-…-3C ⧉ │ mono
│ Data przyjęcia  24.10.2026, 14:02:11       │
│ NIP sprzedawcy  584-279-91-30              │
│ Numer faktury   FV/2026/10/019             │
│ Skrót dokumentu SHA-256 9f2c…e1 ⧉          │ mono, wraps
│ Nr ref. sesji   20261024-SO-…              │
├────────────────────────────────────────────┤
│ Drukuj        [Pobierz UPO (XML)]          │
└────────────────────────────────────────────┘
```

### 2.7 "Zamknij okres": confirmation + JPK
One sheet with a three-step indicator: `Sprawdź · Potwierdź · JPK`. It's the only place that uses the dialog/sheet scrim for a period-wide action.
```
Step 1 Sprawdź                                  Step 3 JPK_V7M · październik 2026
┌ Zamknij okres · październik 2026       ✕ ┐  ┌ JPK_V7M · październik 2026          ✕ ┐
│ ● Sprawdź  ○ Potwierdź  ○ JPK            │  │ Do wysłania do 25.11.2026              │
│ ✓ Wszystkie dokumenty w okresie (41)     │  │ Sprzedaż                               │
│ ✕ 1 faktura odrzucona w KSeF   Wyjaśnij  │  │ K_19 Podstawa 23%        209 678,05    │
│ ⚠ 2 faktury w kolejce KSeF               │  │ K_20 Podatek 23%          48 225,95    │
│ ✓ Brak dokumentów spoza okresu           │  │ K_15 / K_16 5%       2 804,94 / 140,26 │
│ VAT należny 48 366,21 · naliczony 3 231,88│  │ K_10 Zwolnione            14 370,77    │
│ VAT do zapłaty 45 134,33 zł              │  │ Zakupy                                 │
├──────────────────────────────────────────┤  │ K_42 / K_43 Nabycie pozost. … / 3 231,88│
│ Wróć     [Dalej] (disabled while ✕)      │  │ P_38 Razem należny        48 366,21    │
└──────────────────────────────────────────┘  │ P_48 Razem naliczony       3 231,88    │
                                              │ P_51 Do wpłaty            45 134,33    │
                                              ├────────────────────────────────────────┤
                                              │ Drukuj     [Eksportuj JPK (XML)]       │
                                              └────────────────────────────────────────┘
```
- Rejected documents (✕) block the close. Queued ones (⚠) only warn.
- Step 2 ("Potwierdź") is a short statement plus the primary button "Potwierdź okres": "Po potwierdzeniu dokumenty za październik będą tylko do odczytu."
- After confirming:
  - the status line becomes "[lock] Potwierdzony 26.10.2026 · JPK_V7M do wysłania do 25 listopada · Podgląd JPK";
  - every edit affordance hides.
- The JPK field mapping (K_*/P_*) must be verified by the main agent against the JPK_V7M(2) structure.

### 2.8 Period picker [B13 B14 A7]
A popover on desktop, a drawer on the phone. Year stepper on top, a 4×3 grid of months below.
```
‹ 2026 ›                                   Rok wymaga konfiguracji · Skonfiguruj   (A7, wa)
┌──────────┬──────────┬──────────┬──────────┐
│ Styczeń  │ Luty     │ Marzec   │ Kwiecień │  each cell: month (text-title)
│ ✓ wysłany│ ✓ wysłany│ ✓ wysłany│ ✓ wysłany│  JPK line (text-small)
├ …        ┼          ┼ Październ.(selected: accent-fill) ┼ Listopad — ┤
```
- Today's month has a dot.
- Future months show "—" in `ink-3`, but they're still selectable (their empty state is shown).

### 2.9 Notifications [A3]
A popover at 380 px (drawer on the phone). Items are grouped by "Wymaga działania" and "Wcześniej"; the count badge uses `er-fill` with knockout text.
```
Powiadomienia                                     Oznacz jako przeczytane
Wymaga działania
⛔ 1 faktura odrzucona w KSeF · Nordwind · 2 godz.        → triage sheet
⚠ Październik wymaga potwierdzenia · Nordwind             → Zamknij okres
📅 JPK_V7M za październik do 25 listopada · 3 firmy        → period header
⚠ Sesja KSeF wygasa za 2 dni · Odnów połączenie           → toast "Poza prototypem"
Wcześniej
✓ JPK_V7M za wrzesień wysłany · UPO                       → JPK sheet (read-only)
```
- Each item is one clickable row (h ≥56) with the company named. Unread items show a dot in `accent-fill`.
- Icons are lucide, not emoji.

### 2.10 Company switcher + "Obszary i dostępność" [B1 A5 A7 A8 A9]
- The popover (360 px) has a search field and the list of companies (initials avatar, name, NIP, and a status dot showing whether a period needs confirming). The footer is a text button: "Obszary i dostępność".
- The text button opens a right panel or drawer:
```
┌ Obszary księgowe · Nordwind Software   ✕ ┐  (A5: title; the subtitle keeps A5's description)
│ Mapa dostępnych obszarów księgowych dla  │
│ aktywnej organizacji.                    │
│ Okres księgowy · 2026  (Wymaga konfig.)  │  A7 + description
│ Dostępność obszarów                      │  A8 + "Status pokazuje gotowość warunków…"
│ ▸ Rejestr VAT            (Gotowy)        │  A9 rows; expanding one shows its conditions
│ ▸ KPiR                   (Niedostępny)   │
│ ▸ Ewidencja przychodów   (Niedostępny)   │
│ ▸ Pełne księgi           (Wymaga konfig.)│
│ ▸ Majątek                (Wymaga konfig.)│
│ ▸ Kontrole               (Gotowy)        │
└──────────────────────────────────────────┘
```
Accordion rows allow several open at once, with no borders and `line-subtle` separators. The readiness values are demo data, as in the original.

### 2.11 User menu [A1 A2 A4] + demo control [A6 B5 B7]
```
Witaj, Preview Reviewer!          (text-title)
Konto użytkownika                 (ink-2)
Motyw   [Jasny | Ciemny | System] (segmented, A2)
Skróty klawiszowe        ?
Wyloguj                           → toast "Poza prototypem"
```
- Demo control, desktop: a sidebar footer row "⚗ Dane demonstracyjne ⌄" opens a radio list (Dane · Pusto · Błąd · Ładowanie) with the caption "To jest mapa zakresu, a nie uruchomienie księgowania. Dane pozostają demonstracyjne." (A6).
- Demo control, phone: the same as a row in the avatar menu.
- The URL `?state=` keeps working.

## 3. Key scenarios

1. **View a period.**
   1. Open the page; it lands on the current period (Październik 2026).
   2. Read the hero "VAT do zapłaty" and the status line.
   3. Press ‹ or › (or ⌘K, then "wrzesień") to change month. The hero crossfades while the content stays.
   4. Open the month grid to see the JPK status of every month.
2. **Find an invoice.**
   1. Press `/` (or tap the search field).
   2. Type a NIP fragment, a number or a KSeF number. The table filters live and the count updates.
   3. Press ↓ to move into the rows, then Enter to open the detail.
3. **Filter.**
   1. Click "Filtry". Each chip toggle shows its count.
   2. Desktop: the table updates live. Phone: tap "Pokaż 12 dokumentów".
   3. Chips appear under the toolbar. Remove them with ✕, or with "Wyczyść wszystko".
   4. If nothing matches, the no-results block appears with "Wyczyść filtry".
4. **Add an invoice.**
   1. Press "Dodaj dokument" (or N, or the FAB on the phone).
   2. Enter the NIP; the checksum is shown as ✓, or "Niepoprawny NIP" on error.
   3. Enter the dates. A hint appears if the date falls into another period.
   4. Enter Netto; VAT and Brutto appear live.
   5. Save. The panel closes, the new row flashes, and a toast offers "Wyślij do KSeF".
   6. If the server finds a duplicate: an inline error with "Otwórz istniejący".
5. **Send to KSeF and resolve a rejection.**
   1. From the detail (or the bulk bar), press "Wyślij do KSeF". The status goes W kolejce, then Przetwarzanie (arc), then Przyjęta (number + UPO) or Odrzucona.
   2. On a rejection, the attention line appears: "1 dokument do wyjaśnienia". Open "Wyjaśnij".
   3. The triage sheet shows the reason and what to do. Press "Popraw dane"; the form opens with the NIP field highlighted.
   4. Fix it and save. The document re-queues automatically and ends up Przyjęta.
   5. Then "Pokaż UPO". For a session error, use "Odnów połączenie" instead (§5).
6. **Confirm the period.**
   1. In the status line, press "Zamknij okres".
   2. *Sprawdź*: if anything is blocking, "Wyjaśnij" jumps to triage and the sheet resumes afterwards.
   3. *Potwierdź*: press "Potwierdź okres". The period locks; the status line shows the lock icon and the edit actions disappear.
   4. The sheet advances to *JPK*.
7. **JPK.**
   1. Open "Podgląd JPK" from the status line (or ⌘K, or the month grid's "do wysłania").
   2. Review the K_/P_ fields, then press "Eksportuj JPK (XML)" (a file download) or "Drukuj".
   3. For a sent month, the JPK sheet shows "Wysłany 20.10 · UPO".

## 4. What hides behind which action

| Action / trigger | Reveals | Inventory |
|---|---|---|
| Company switcher | companies list, search · "Obszary i dostępność" | B1, A5, A7, A8, A9 |
| Sidebar nav / bottom nav | areas; non-VAT → toast "Poza prototypem" | A10 |
| Bell | notifications | A3 |
| Avatar / user row | greeting, Motyw, Skróty, Wyloguj (+ demo on phone) | A1, A2, A4 |
| "Dane demonstracyjne" | demo state + scope disclaimer | A6, B5, B7 |
| Period title ⌄ | month grid with JPK statuses, year stepper, year configuration status | B13, B14, A7 |
| Status line "Zamknij okres" | checklist → confirm → JPK | B4, B7 |
| Attention line "Wyjaśnij" | KSeF triage sheet | — |
| "Filtry" | Rodzaj operacji, Status KSeF, Kod JPK V7, Stawka VAT, Serie dokumentów, Sortuj (phone), Wyczyść | B12, B15, B16, B17, B18, B27 |
| ⋯ (toolbar) | Drukuj rejestr · Eksportuj (CSV, JPK_V7M XML) · Podgląd JPK · Synchronizuj z KSeF · Odśwież · Kolumny (visibility + order) · Oznacz kodami JPK… (enters selection mode) | B9, B10, B11, B26 |
| Column header | sort ↑/↓ | B27 |
| Row click / Enter | detail panel / drawer | B28 |
| Row ⋯ | Otwórz · Wyślij do KSeF · Edytuj · Drukuj dokument · Usuń | B28, B10 |
| Row checkbox (≥1) | selection bar: Wyślij do KSeF, Oznacz kodami JPK, Eksportuj, Drukuj, Usuń | B9 |
| "Rate bar" / "Stawki ⌄" (phone) | per-rate legend with net and VAT per rate, incl. zw and np | B20 |
| Detail → "Pokaż UPO" | UPO view | — |
| ⌘K | everything above, plus periods, companies and documents | — |
| Footer | range, page size, pager | B29, B30, B31 |
| Dropped as redundant | the subtitle "Sprzedaż i zakupy…" | B3 |
| Always visible | title, tabs with counts, totals, search, Dodaj | B2, B6, B8, B19, B21–B25 |

Every row from A1–A10 and B1–B31 now has a home.

## 5. KSeF statuses and copy

The type change in `types.ts`: replace `pending | unconfirmed` with `not_sent | queued | processing`, and keep `accepted | rejected | outside`. The `ksef` field also gets `{ number?, acceptedAt?, error?: { code, field? }, upoRef? }`.

| status | label (cell) | KSeF number column | detail line | allowed actions |
|---|---|---|---|---|
| not_sent | Nie wysłana | **Brak potwierdzenia** (B24 text, `ink-3`) | "Faktura nie została jeszcze wysłana do KSeF." | Wyślij do KSeF, Edytuj |
| queued | W kolejce | Brak potwierdzenia | "Czeka na wysłanie. Możesz zamknąć to okno." | — |
| processing | Przetwarzanie | Brak potwierdzenia | "KSeF weryfikuje fakturę. Status odświeży się sam." | — |
| accepted | Przyjęta | the number, mono, truncated in the middle, ⧉ in the detail | "Przyjęta {dd.mm.rrrr, gg:mm}. Numer KSeF nadany." | Pokaż UPO |
| rejected | Odrzucona | Brak potwierdzenia | the error title + "co zrobić" (below) | Popraw dane / Wyślij ponownie |
| outside | Poza KSeF | — | "Dokument nie podlega KSeF (np. paragon, faktura zagraniczna)." | — |

**Error catalogue** (demo codes; real KSeF codes come later from the API):
| code | title | why | what to do | action → result |
|---|---|---|---|---|
| `NIP_NABYWCY` | Niepoprawny NIP nabywcy | "KSeF nie znalazł podmiotu o NIP {nip}." | "Sprawdź NIP na fakturze i popraw go. Po zapisie wyślemy fakturę ponownie." | **Popraw dane** → form, NIP field focused |
| `DUPLIKAT` | Faktura już jest w KSeF | "Faktura o numerze {nr} od tego sprzedawcy została już przyjęta ({ksef})." | "Jeśli to ta sama faktura, oznacz ją jako przyjętą. Jeśli inna, nadaj jej nowy numer." | **Popraw dane** → Numer field · text "Pokaż przyjętą" |
| `SCHEMAT_FA3` | Błąd struktury FA(3) | "Pole {pole} nie spełnia wymagań schematu FA(3)." | "Uzupełnij lub popraw wskazane pole. Pozostałe dane są poprawne." | **Popraw dane** → mapped field |
| `DATA_PRZYSZLA` | Data wystawienia z przyszłości | "Data {data} jest późniejsza niż dzisiejsza. KSeF przyjmuje faktury wystawione najpóźniej dziś." | "Zmień datę wystawienia albo wyślij fakturę w dniu jej wystawienia." | **Popraw dane** → Data wystawienia |
| `SESJA_WYGASLA` | Sesja KSeF wygasła | "Token autoryzacyjny stracił ważność, więc faktura nie została wysłana." | "Odnów połączenie z KSeF i wyślij ponownie. Dane faktury są poprawne." | **Odnów połączenie** → demo: success toast, then auto-resend |

Generic copy:
- Bulk send: "Wysłano 5 faktur do KSeF. 1 wymaga uwagi." with the text action "Pokaż".
- Network failure on send: the toast "Nie udało się połączyć z KSeF. Spróbuj ponownie." with the action "Ponów". The status stays as it was.

## 6. Mobile patterns (<768)
- **Top bar:** company ⌄ · bell · avatar.
- **Bottom nav:** the 4 areas, with labels. The FAB sits 16 px above it; there is only one FAB, and it hides while a drawer is open or the keyboard is up.
- **Header:** the period is the title, with ‹ › targets of 44. The sticky mini-context in the top bar appears after the hero scrolls away.
- **Overlays:** every popover and menu becomes a vaul drawer. Detail, the form, triage, JPK and Zamknij okres are 92 dvh drawers with a pinned footer. Tabs and search stick together under the top bar.
- **List:** day groups with a sticky header; the whole row is the target. Long-press enters selection mode, and the selection bar replaces the bottom nav. Swipe actions: none, because they're undiscoverable and fight vaul.
- **Pagination:** load more ("Pokaż kolejne 10 (z 24)") instead of a pager. Sort lives in the filters drawer.
- **Inputs:** 16 px, `inputMode="decimal"` for amounts and `numeric` for the NIP; dates use the custom picker in a drawer.
- **Toasts:** bottom-centre, above the nav.

## 7. States per screen

Rule: every screen ships 4+ states. Error never blanks the shell (the baseline's error state renders an empty page: P1).

| screen | filled | empty | no-results | error | loading | extra |
|---|---|---|---|---|---|---|
| Main view | §2.1 | hero 0,00 in `ink-3` + the empty-register block ("Brak dokumentów w październiku", Dodaj dokument); the attention line and rate bar are hidden | the no-results block in place of the table, chips stay | header + tabs stay; the register band shows the error block + Spróbuj ponownie; the hero shows "—" | skeleton hero, rate bar, 8 rows; real labels | read-only (confirmed), future month |
| Filters | counts | all counts 0 → "Brak dokumentów do filtrowania" | "Pokaż 0" disabled, with "Wyczyść" emphasised | counts hidden, chips still usable | counts as skeleton dashes | — |
| Detail | §2.3 | n/a | n/a | "Nie udało się wczytać dokumentu" + Spróbuj ponownie, header kept | skeleton blocks | read-only, each KSeF state |
| Form | edit prefilled | new | n/a | field errors + summary; save error inline at the footer: "Nie zapisano. Spróbuj ponownie." | Zapisz in its loading state, fields disabled | duplicate, other-period hint |
| KSeF triage | 1 z n | "Wszystko wyjaśnione" | n/a | the resend failed → inline er-soft line | arc on resend | session error variant |
| UPO | §2.6 | n/a | n/a | "UPO jest jeszcze niedostępne. Zwykle pojawia się kilka minut po przyjęciu." | skeleton | — |
| Zamknij okres | checklist | empty period: "Brak dokumentów. Możesz potwierdzić pusty okres." | n/a | confirm failed → inline + Ponów | Potwierdź in its loading state | blocked (✕), already confirmed |
| JPK | fields | all zeros, "Brak danych za okres" | n/a | error block + Spróbuj ponownie | skeleton rows | sent (read-only + UPO), future month |
| Period picker | grid | n/a | n/a | grid without JPK lines + "Statusy JPK niedostępne" | skeleton lines | year needs configuration |
| Notifications | grouped | "Nic nowego. Damy znać, gdy coś będzie wymagało działania." | n/a | "Nie udało się wczytać powiadomień" + Ponów | 3 skeleton rows | — |
| Company switcher / Obszary | list | n/a | search: "Brak firmy „{q}”" | error + Ponów | skeleton rows | — |
| User menu | static | — | — | — | — | theme change applies instantly |

## 8. Implementation order (screen by screen; each gets build + lint + 375/1440 × states + one review)
0. **Foundations.**
   - In `globals.css`: Tier 1 + Tier 2 tokens, light and dark, the bridge aliases, fonts in `layout.tsx`, motion and reduced-motion rules.
   - Restyle the `components/ui/*` primitives in this order: icons and status pills → chips → buttons → input/search → tabs/segmented → menu/popover → sheet/drawer/dialog → toast → skeleton.
   - Build `<Money>` per DS §8.
1. **Shell:** sidebar / rail / top bar + bottom nav; company switcher popover; user menu with Motyw; demo control (remove the floating pill); bell (static list for now).
2. **Period header + summary:** title, stepper, month grid, status line, hero, register totals line, rate bar + legend, attention line.
3. **Register:**
   - tabs, toolbar, the filters panel/drawer with the new fields (`operationType`, `series`, JPK code, `np` rate);
   - chips; the table with container-query column dropping, sort, the column manager;
   - the day list; footer/pager/load-more; selection bar.
4. **Detail + form:** the detail panel/drawer; the add/edit form with validation and the custom date picker; delete + undo.
5. **KSeF:** the new statuses in `types.ts`/`api.ts` with the deterministic error seed; the progress simulation; the triage sheet; the UPO view; bulk send; notifications wired to real data.
6. **Zamknij okres + JPK:** checklist, confirm, read-only mode, JPK preview and export.
7. **Obszary i dostępność** sheet [A5 A7 A8 A9].
8. **States sweep** across all screens (§7), then dark-mode pass, then the final inventory check.

## 9. Open questions for the owner
1. **Accepted invoices:** may they be edited in the prototype, or is Edytuj disabled with the hint "zmiana wymaga korekty" (the proposed default)?
2. **Unlocking a confirmed period:** add "Otwórz okres ponownie" in the period sheet for the demo, or keep the lock final?
3. **Accent:** ultramarine (proposed). The alternative is a vermilion "stamp" red, rejected because it would compete with errors.
4. **B9 (tag icon):** is it really "assign JPK codes to selected documents"? Is the selection mode it requires acceptable?
