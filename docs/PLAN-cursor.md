# PLAN: Redesign ekranu „Rejestry i VAT”

**Projekt:** prototyp frontendowy (demo) — redesign jednego ekranu aplikacji księgowej SaaS  
**Deadline:** piątek 30.10.2026  
**Stack:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, lucide-react  
**Język UI:** polski (`lang="pl"`)  
**Zakres tego dokumentu:** plan pełnej implementacji. Milestone 1–2 (plan + scaffold) są w toku; UI pełne = M3+.

Pełnowymiarowe zrzuty referencyjne trafią później do `refs/`. Elementy oznaczone **[VERIFY]** w `docs/inventory.md` wymagają potwierdzenia po ich dodaniu.

---

## 1. Cele i kryteria akceptacji

### Cele produktowe
- Przeprojektować ekran **Rejestry i VAT** tak, by był czytelny „od razu”, bez instrukcji.
- Uprościć i wyczyścić UI: kluczowe rzeczy na wierzchu, drugorzędne w menu / sheetach.
- **Nie zgubić żadnego pola ani akcji** z referencji (dowód = `docs/inventory.md`).
- Dowieźć klikalny prototyp z danymi mock i stanami filled / empty / error (+ loading).
- Desktop + iPhone SE (375×667), płynne zwężanie okna.
- Własna, nowoczesna wizja — nie kopia z drobnymi poprawkami.
- Estetyka: bez ciężkich ramek/boxów; dane pieniężne czytelne (tabular nums, wyrównanie, `pl-PL`).

### Checklist akceptacji (z briefu)

| # | Kryterium | Status |
|---|-----------|--------|
| A1 | Ekran jest jasny na pierwszy rzut oka | ☐ |
| A2 | Prosty i logiczny: główne rzeczy widoczne, bez zbędnego | ☐ |
| A3 | Czysty: tylko kluczowa funkcjonalność na start; reszta w menu/funkcjach | ☐ |
| A4 | Żadne pole i żadna akcja z referencji nie zginęła (mapa w inventory) | ☐ **[VERIFY refs]** |
| A5 | Stan filled (dane demo) działa | ☐ |
| A6 | Stan empty (brak danych) działa | ☐ |
| A7 | Stan error działa | ☐ |
| A8 | Prototyp klikalny (filtry, wiersz, detail, akcje) | ☐ |
| A9 | Desktop layout kompletny | ☐ |
| A10 | Mobile 375px (iPhone SE) kompletny | ☐ |
| A11 | Płynne zachowanie przy zwężaniu okna | ☐ |
| A12 | Oryginalna, nowoczesna wizja (nie kopia) | ☐ |
| A13 | Demo publiczne (Vercel) — robi Mikki | ☐ (poza agentem) |
| A14 | Repo publiczne (GitHub) — robi Mikki | ☐ (poza agentem) |

### Kryteria jakości technicznej (wewnętrzne)
- [ ] `pnpm build` i `pnpm lint` przechodzą
- [ ] Kontrast AA, keyboard nav, focus-visible, aria
- [ ] Formaty `pl-PL` (daty, PLN)
- [ ] Lighthouse (mobile/desktop) — smoke, bez regresji oczywistych
- [ ] README z decyzjami projektowymi (co zmieniono i dlaczego)

---

## 2. Architektura informacji

```
App shell
├── Top bar
│   ├── Okres księgowy (rok / okres)          [z ref. „Okres księgowy – 2026”]
│   ├── Kontekst firmy / podmiotu             [VERIFY]
│   └── Użytkownik (avatar / menu)            [VERIFY]
│
└── /rejestry  — „Rejestry i VAT”
    ├── Page header
    │   ├── Tytuł + opcjonalny breadcrumb
    │   ├── Primary CTA: „Dodaj dokument” (lub Import)
    │   └── Secondary: menu „…” (eksport, ustawienia widoku, JPK…)
    │
    ├── Alert (dismissible)                   [z warning banner]
    │
    ├── Register tabs                         [typy rejestrów / podwidoki]
    │   np. Sprzedaż | Zakup | Wszystkie      [VERIFY dokładne etykiety]
    │
    ├── KPI summary (3 metryki, bez boxów)
    │   ├── Netto
    │   ├── VAT
    │   └── Brutto
    │   (+ subtle progress okresu / status JPK) [VERIFY sens progress bara]
    │
    ├── Filter bar
    │   ├── Search (nr dok., NIP, kontrahent)
    │   ├── 1–2 kluczowe filtry (typ rejestru, status)
    │   ├── „Filtry” → sheet/popover (reszta)
    │   └── Active filter chips (removable)
    │
    ├── Content
    │   ├── Desktop: data table (+ pagination)
    │   └── Mobile: card list
    │
    └── Detail
        ├── Desktop: side sheet / panel
        └── Mobile: full-screen sheet
```

**Poza zakresem redesignu (kontekst z ref. 1):** strona „Obszary księgowe” / nawigacja modułów — nie budujemy pełnego dashboardu; top bar i tytuł dają kontekst. Link z root (`/`) prowadzi do `/rejestry`.

---

## 3. Inventory pól i akcji

Pełna mapa: **[`docs/inventory.md`](./inventory.md)**.

Zasada: każdy element widoczny w opisie referencji (i później na full-size refs) ma wiersz z lokalizacją w nowym UI. Po dodaniu zrzutów — przejść listę i odhaczyć **[VERIFY]**.

---

## 4. Layouty (wireframe notes)

### 4.1 Desktop (≥1280px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo/app]   Okres: 2026 ▾    Firma ▾              Preview Reviewer ▾    │  top bar ~48px
├──────────────────────────────────────────────────────────────────────────┤
│ Rejestry i VAT                         [Dodaj dokument]  [⋯]             │
│ ⚠ Alert: okres / JPK — treść…                              [Akcja] [✕]   │
│                                                                          │
│ [ Sprzedaż ] [ Zakup ] [ Wszystkie ]                                     │  tabs
│                                                                          │
│  Netto              VAT                 Brutto                           │  KPI (plain type)
│  128 450,00 zł      29 543,50 zł        157 993,50 zł                    │
│  ████████████░░░░  status okresu / JPK                                   │  thin progress
│                                                                          │
│ [🔍 Szukaj…]  [Status ▾]  [Filtry]   chips: Status: Wystawiona ✕         │
│                                                                          │
│ Data │ Nr dok. │ NIP │ Kontrahent │ Netto │ VAT │ Brutto │ Status │ ⋯   │  sticky th
│──────┼─────────┼─────┼────────────┼───────┼─────┼────────┼────────┼─────│
│ …    │ …       │ …   │ …          │  →    │  →  │   →    │ pill   │ ⋮   │  no cell borders
│ … zebra / hover; click row → detail panel (right ~420px)                 │
│                                                                          │
│                                         « 1 2 3 … »   20 / strona        │
└──────────────────────────────────────────────────────────────────────────┘
```

Zasady desktop:
- Bez kart-boxów wokół KPI; typografia + spacing.
- Kwoty `text-right tabular-nums`.
- Sticky header tabeli; kebab na wierszu; klik wiersza = detail.

### 4.2 Tablet (~768px)

- KPI w jednym rzędzie (mniejszy type) lub 3 kolumny z mniejszym gap.
- Tabela z poziomym scrollem **lub** ukrycie kolumn drugorzędnych (NIP w detail) — preferencja: zachować kluczowe 5 kolumn + scroll.
- Filtry: search + przycisk Filtry (sheet).

### 4.3 Mobile — iPhone SE 375×667

```
┌─────────────────────────────┐
│ ≡  Rejestry i VAT      ⋯    │  compact top
│ Okres: 2026 ▾               │
├─────────────────────────────┤
│ ⚠ Alert (1 linia + akcja)   │
│ [Sprzedaż][Zakup][Wsz.]     │  scroll tabs
│                             │
│ Netto        128 450,00 zł  │  KPI stacked or 2+1
│ VAT           29 543,50 zł  │
│ Brutto       157 993,50 zł  │
│ ▓▓▓▓▓▓▓░░ status            │
│                             │
│ [🔍] [Filtry]               │
│ chips…                      │
│                             │
│ ┌─────────────────────────┐ │
│ │ Kontrahent        Brutto│ │  card list
│ │ 12.03.2026 · FV…  status│ │
│ └─────────────────────────┘ │
│ …                           │
│                             │
│        (lista)              │
├─────────────────────────────┤
│     [ + Dodaj dokument ]    │  sticky bottom CTA
└─────────────────────────────┘
```

Detail = full-screen `Sheet`. Filtry zaawansowane = bottom sheet. Progressive: przy zwężaniu tabela → karty (breakpoint ~768px).

---

## 5. Lista komponentów

### Layout (`src/components/layout/`)
| Komponent | Rola |
|-----------|------|
| `AppShell` | Wrapper: top bar + main |
| `TopBar` | Okres, firma, user |
| `PageHeader` | Tytuł, primary CTA, menu ⋯ |
| `DevStateSwitcher` | Dev-only przełącznik `?state=` |

### Registers (`src/components/registers/`)
| Komponent | Rola |
|-----------|------|
| `AlertBanner` | Dismissible alert |
| `RegisterTabs` | Sprzedaż / Zakup / … |
| `KpiSummary` | 3 metryki + progress |
| `FilterBar` | Search, quick filters, chips |
| `FilterSheet` | Pełne filtry (sheet/popover) |
| `EntriesTable` | TanStack Table (desktop) |
| `EntriesCardList` | Lista kart (mobile) |
| `EntryRowActions` | Dropdown ⋮ |
| `EntryDetailSheet` | Panel szczegółów |
| `Pagination` | Stronicowanie |
| `AddDocumentDialog` | Placeholder formularza dodawania |

### States (`src/components/states/`)
| Komponent | Rola |
|-----------|------|
| `LoadingSkeleton` | Skeleton KPI + lista |
| `EmptyState` | Ikona + zdanie + CTA |
| `ErrorState` | Komunikat + „Spróbuj ponownie” |

### shadcn primitives (inicjalnie)
`button`, `input`, `select`, `dropdown-menu`, `sheet`, `dialog`, `badge`, `skeleton`, `tabs`, `tooltip`, `popover`, `separator`, `table`, `sonner`

### Lib / data
- `src/lib/types.ts` — modele domenowe  
- `src/lib/format.ts` — `pl-PL` currency/date  
- `src/lib/api.ts` — fake async fetch + `?state=`  
- `src/data/mock-entries.ts` — ~40 wpisów demo  

---

## 6. Design tokens (borderless, clean)

Kierunek: spokojny neutral + jeden akcent; zero ciężkich ramek; światło; 8px grid. Unikać „AI slop”: fioletowych gradientów, cream+terracotta, newspaper dense rules.

### Kolory (CSS variables — do `globals.css`)

| Token | Wartość (propozycja) | Użycie |
|-------|----------------------|--------|
| `--background` | `#FAFAF9` | tło strony (ciepły off-white, nie flat #fff) |
| `--foreground` | `#1C1917` | tekst główny (stone-900) |
| `--muted` | `#F5F5F4` | hover wiersza / subtle fill |
| `--muted-foreground` | `#78716C` | secondary text |
| `--border` | `#E7E5E4` | hairline tylko gdzie konieczne (separator, input) |
| `--accent` | `#0F766E` | teal-700 — CTA, focus, aktywny tab |
| `--accent-foreground` | `#FFFFFF` | tekst na akcencie |
| `--destructive` | `#B91C1C` | błędy |
| `--success` | `#15803D` | status OK / JPK wysłany |
| `--warning` | `#B45309` | alert okresu |
| `--ring` | `#0F766E` | focus-visible |

KPI i tabela: **bez** box-shadow kart i **bez** borderów komórek; separator wierszy `1px` hairline lub zebra `muted`.

### Typografia
- Font: **Geist Sans** (primary) z fallbackiem Inter / system.
- Skala:

| Token | Size / line | Waga | Użycie |
|-------|-------------|------|--------|
| `display` | 28/34 | 600 | tytuł strony (desktop) |
| `title` | 20/28 | 600 | mobile title / sheet |
| `kpi` | 24/32 | 600 | kwoty KPI (`tabular-nums`) |
| `body` | 14/20 | 400 | UI |
| `body-sm` | 13/18 | 400 | meta, tabela |
| `caption` | 12/16 | 500 | labele, chips |

### Spacing (8px)
`0, 4, 8, 12, 16, 24, 32, 40, 48, 64` — Tailwind scale; sekcje `gap-6`/`gap-8`.

### Radius
- Kontrole: `6px` (`rounded-md`)
- Sheet/dialog: `12px` (`rounded-xl`)
- Badge/pill: `9999` tylko dla statusów (świadomie, nie dla CTA)

### Shadows
Minimalne — prawie borderless:
- `shadow-sm` tylko na elevated sheet/popover/dialog
- Brak multi-layer glow; brak shadow na KPI i wierszach tabeli

---

## 7. Stany i przełączanie

| State | Zachowanie UI | Jak włączyć |
|-------|---------------|-------------|
| `filled` | KPI + lista z mock data | `?state=filled` (domyślne) |
| `empty` | EmptyState; KPI zerowe lub „—” | `?state=empty` |
| `error` | ErrorState; retry wywołuje refetch | `?state=error` |
| `loading` | Skeleton; API trzyma pending / sztuczne opóźnienie | `?state=loading` |

Implementacja:
1. `DevStateSwitcher` (fixed, corner) zmienia `searchParams.state` (client navigation).
2. `lib/api.ts` → `fetchEntries({ state, …filters })`:
   - latency ~400–800 ms (poza `loading`, które może wisieć lub zwracać po dłuższym delay + nadal skeleton do anulowania),
   - `error` → `throw` / `{ ok: false }`,
   - `empty` → `{ entries: [], totals: zero }`,
   - `filled` → mock + ewentualne filtrowanie po stronie klienta.
3. Strona `/rejestry` czyta state z URL i renderuje odpowiedni branch.

Dodatkowo: dismiss alertu (local state / sessionStorage); walidacja pól w dialogu dodawania (field-level errors) — w M5.

---

## 8. Model danych (mock)

```ts
type RegisterType = "sprzedaz" | "zakup";
type EntryStatus = "wystawiona" | "oplacona" | "czesciowo" | "anulowana" | "robocza";
type JpkStatus = "nie_gotowe" | "gotowe" | "wyslane" | "blad";

interface VatEntry {
  id: string;
  registerType: RegisterType;
  issueDate: string;       // ISO date
  documentNumber: string;  // np. FV/2026/03/12
  nip: string;             // 10 cyfr, PL
  counterpartyName: string;
  description?: string;
  net: number;             // PLN, decimal
  vat: number;
  gross: number;           // net + vat (spójne w mocku)
  vatRate: number;         // 0 | 5 | 8 | 23
  status: EntryStatus;
  jpkStatus: JpkStatus;
  currency: "PLN";
}
```

`src/data/mock-entries.ts`: ~40 realistycznych wpisów PL (różne NIP-y, kontrahenci, daty w 2026, mieszanka sprzedaży/zakupu, statusów, stawek VAT).

Agregaty KPI: suma `net` / `vat` / `gross` po aktualnych filtrach + typie rejestru.

---

## 9. A11y

- Semantyka: `header`, `main`, `nav` (tabs), tabela z `<th scope>`.
- Focus-visible ring (token `--ring`); nie usuwać outline.
- Tabs, Dialog, Sheet, Dropdown — shadcn/Radix (keyboard + aria).
- Statusy nie tylko kolorem (tekst / badge z labelką).
- Kontrast AA na tekście i kontrolkach.
- `aria-live` dla błędów ładowania / toastów (sonner).
- Touch targets ≥44px na mobile (sticky CTA, ikony filtrów).
- `lang="pl"` na `<html>`.

---

## 10. Performance

- Server Components tam gdzie możliwe; client tylko interaktywne wyspy (table, filters, switcher).
- Lazy / conditional: detail sheet mount on open.
- Obrazy: brak ciężkich ilustracji w empty state (ikona lucide).
- TanStack Table: paginacja client-side na mocku; bez wirtualizacji na start (~40 wierszy OK); dodać jeśli refs pokażą setki.
- Font: `next/font` (Geist), `display: swap`.
- Unikać layout shift: skeleton o tej samej strukturze co filled.

---

## 11. Kamienie milowe i szacunek czasu

Deadline: **30.10.2026** (piątek). Bufor QA w czwartek/piątek.

| # | Milestone | Zadania | h (szac.) | Cel |
|---|-----------|---------|-----------|-----|
| **M1** | Plan + inventory | `PLAN.md`, `inventory.md`, wireframes | 2–3 | ✅ ten turn |
| **M2** | Scaffold | Next.js, shadcn, foldery, mock, api, shell, README, lint/build | 3–4 | ✅ ten turn |
| **M3** | Desktop register | KPI, filtry, tabela, detail, alert, tabs, pagination | 8–10 | śr–czw |
| **M4** | Mobile + responsive | card list, sheets, sticky CTA, breakpoints | 5–6 | czw |
| **M5** | Stany + polish | empty/error/loading, switcher UX, mikroanimacje, formularz stub | 3–4 | czw–pt |
| **M6** | QA + docs | 375/768/1280/1440, a11y smoke, Lighthouse, README decisions | 2–3 | pt |
| **M7** | GitHub + Vercel | konta i deploy — **Mikki** | — | pt |

**Razem agent:** ~23–30 h roboczych w oknie do piątku. Priorytet przy poślizgu: A4 inventory → filled desktop → mobile → stany → polish.

---

## 12. Ryzyka i otwarte pytania

1. **Full-size refs jeszcze niedostępne** — inventory ma luki **[VERIFY]** (dokładne etykiety tabów, kolumny, akcje w ⋯, sens progress bara, treść bannera).  
2. **KPI: netto/VAT/brutto vs VAT należny/naliczony/do zapłaty** — brief wspomina obie możliwości; domyślnie netto/VAT/brutto do potwierdzenia na refs.  
3. **Zakres „Obszary księgowe”** — tylko kontekst; czy klient oczekuje też landing/nawigacji obszarów?  
4. **Import / JPK / eksport** — akcje w menu secondary; głębokość flow (stub vs mini-wizard)?  
5. **Autoryzacja / multi-firma** — w top barze jako UI-only, bez backendu.  
6. **Dark mode** — opcjonalny, tylko jeśli zostanie czas po A1–A12.  
7. **Paginacja vs infinite scroll** — refs sugerują paginację; trzymamy paginację.  
8. **Prawdziwe NIP checksum** — mock może używać poprawnych checksum dla wiarygodności; nie blokuje UI.  
9. **Deadline vs deploy** — agent nie robi GitHub/Vercel; Mikki musi mieć konta gotowe przed pt.  
10. **Data w user_info vs brief** — rok demo **2026** (zgodnie z briefem „Okres księgowy – 2026”).

---

## 13. Struktura katalogów (docelowa)

```
/
├── docs/
│   ├── PLAN-draft.md
│   ├── PLAN.md
│   └── inventory.md
├── refs/
│   └── task-brief.png   (+ full-size later)
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              → redirect/link do /rejestry
│   │   ├── globals.css
│   │   └── rejestry/
│   │       └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── registers/
│   │   ├── states/
│   │   ├── ui/                   # shadcn
│   │   └── dev/
│   │       └── state-switcher.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── format.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── data/
│       └── mock-entries.ts
├── components.json
├── package.json
├── README.md
└── .gitignore
```

---

## 14. Kolejność po tym turnie

1. Mikki wrzuca full-size refs → aktualizacja `inventory.md` (odhaczenie VERIFY).  
2. M3: desktop UI na shellu.  
3. M4 → M5 → M6.  
4. Commit dopiero na komendę Mikkiego; potem jego GitHub + Vercel.
