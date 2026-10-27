# Saldo design system: "Papier i atrament"

Owner: design lead. Status: v1, proposed for the owner's review, not yet in code.
This is the DESIGN.md-style glossary [167]. The values live in code, in `src/app/globals.css`, and this file explains what each one is for. If the two disagree, the code is wrong and gets fixed.
Course refs `[n]` point to `docs/design-principles.md`. **CD** marks a *craft decision (not from the course)*.

**The idea in one line:** warm paper, cool ink, one ultramarine stamp. The sheet of paper is the interface. Money is set like a headline. Colour shows up only where something needs a decision.

---

## 1. Tokens: architecture [31][33][91]

| Tier | Where | Naming | Who may use it |
|---|---|---|---|
| 1 · primitives | `:root` in `globals.css` | `--p-paper-50`, `--p-ink-900`, `--p-acc-600`, `--p-ok-600`, `--p-wa-500`, `--p-er-600` | **Only Tier 2.** These are not exposed to `@theme`, so no `bg-p-*` utility exists and components can't reach them [166]. |
| 2 · semantic | `:root` (light) and `.dark` (dark) | `--surface-*`, `--ink-*`, `--line-*`, `--accent-*`, `--{status}-*`, `--focus-*` | Components, through `@theme inline` → `bg-surface-sheet`, `text-ink-2`, … |
| 3 · component | `globals.css`, only when Tier 2 can't express it | `--row-h`, `--sheet-w`, `--hero-size` | Named per component |
| bridge | `globals.css` | shadcn names (`--background`, `--primary`, `--border`, `--ring`, …) as aliases of Tier 2 | Only shadcn internals while they're being restyled. **New code never uses a bridge name.** |

Test mode [162]: set every Tier-2 `--accent-*` to `oklch(0.7 0.3 340)` (pink). Anything that doesn't turn pink is hard-coded, and that counts as a defect.

## 2. Tier 1: OKLCH primitives

All values are inside the sRGB gamut (checked by script). The hex values are only for reference.

**Paper: warm neutrals, H 74–85.** Surfaces and lines in light mode, text in dark mode.
| step | oklch | hex |
|---|---|---|
| paper-0 | 0.995 0.004 85 | #fffdfa |
| paper-50 | 0.976 0.011 84 | #fbf7ef |
| paper-100 | 0.958 0.014 82 | #f6f0e7 |
| paper-150 | 0.936 0.016 80 | #f0e9de |
| paper-200 | 0.905 0.018 78 | #e6ded3 |
| paper-300 | 0.860 0.020 76 | #d9d0c3 |
| paper-400 | 0.800 0.016 80 | #c3bdb2 |
| paper-500 | 0.660 0.014 78 | #979189 |

**Ink: cool blue-black, H 265.** Text in light mode, surfaces in dark mode. **CD**: the warm paper and cool ink are deliberately two temperatures, like real ink on paper. The baseline had "5 million shades of gray" [165]. Here there are two ramps, and each one has a job.
| step | oklch | hex |
|---|---|---|
| ink-450 | 0.62 0.016 265 | #818690 |
| ink-500 | 0.53 0.018 265 | #676c77 |
| ink-600 | 0.48 0.020 265 | #585e69 |
| ink-700 | 0.40 0.024 265 | #414855 |
| ink-800 | 0.31 0.026 265 | #2a303e |
| ink-850 | 0.245 0.026 265 | #1a202d |
| ink-900 | 0.215 0.026 265 | #141926 |
| ink-925 | 0.185 0.022 265 | #0e131d |
| ink-950 | 0.160 0.020 265 | #090d16 |
| ink-975 | 0.145 0.020 265 | #060a13 |

**Accent: "Ultramaryna", H 272.** The one saturated colour. It is an ink-stamp blue, purposely not the green of the baseline and not Tailwind's `blue-600` (H 262, flatter). Lightness was tuned against the target contrast, and chroma was clipped to the gamut [165].
| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| .965 .016 | .925 .034 | .86 .066 | .77 .114 | .68 .164 | .585 .205 | .50 .215 | .43 .19 | .35 .15 | .27 .10 |
| #eff3ff | #dee5fe | #c1cffd | #9bb0fd | #768efc | #556af3 | #3f4cdb | #323bb5 | #232b87 | #171f56 |

**Status ramps** [107]. Only these steps exist, because only these steps are used.
| ramp (H) | 50 | 100 | 300 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|
| ok (155) | .965 .03 | .925 .055 | .78 .12 | .62 .14 | .52 .12 | .44 .10 | .34 .07 | .27 .05 |
| wa (80→55) | .97 .025 80 | .935 .06 80 | .83 .14 78 | .74 .15 72 | .62 .13 62 | .50 .12 58 | .39 .09 55 | .29 .06 55 |
| er (25–27) | .965 .016 | .93 .034 | .78 .12 | .64 .19 | .55 .20 | .47 .17 | .37 .12 | .28 .08 |

There is no separate info ramp. **Info is the accent.** In-progress KSeF states use the accent ("the system is working on it"). That keeps the palette to one accent and three statuses.

## 3. Tier 2: semantic tokens (light / dark)

| token | light | dark | role |
|---|---|---|---|
| `--surface-desk` | paper-150 | ink-950 | app background behind the sheet; sidebar sits on it |
| `--surface-sheet` | paper-50 | ink-925 | main content sheet: the "paper" |
| `--surface-raised` | paper-0 | ink-900 | detail panel, sticky toolbars |
| `--surface-overlay` | paper-0 | ink-850 | popovers, menus, dialogs, drawers |
| `--surface-sunken` | paper-100 | ink-950 | input fill, rate-bar track, skeleton base |
| `--surface-hover` | paper-100 | ink-900 | row and ghost-button hover |
| `--surface-pressed` | paper-150 | ink-850 | active press, open menu trigger |
| `--surface-selected` | acc-50 | acc-900 | selected row, current nav item |
| `--surface-inverse` | ink-900 | paper-100 | toasts, kbd hints, tooltip |
| `--scrim` | ink-900 / 0.32 | ink-975 / 0.64 | behind modal dialogs and mobile drawers only |
| `--ink-1` | ink-900 | paper-100 | primary text, integers in amounts |
| `--ink-2` | ink-600 | paper-400 | secondary text, labels, NIP |
| `--ink-3` | ink-500 | paper-500 | tertiary: decimals, "zł", placeholders, meta |
| `--ink-disabled` | ink-450 | ink-600 | disabled text (exempt from AA; 3.4 light, 2.9 dark) |
| `--ink-inverse` | paper-50 | ink-900 | text on `surface-inverse` |
| `--line-subtle` | paper-200 | ink-800 | the only allowed separator (see §8) |
| `--line-control` | ink-450 | ink-450 | the ledger underline of inputs (non-text 3:1) |
| `--accent-fill` / `-hover` / `-active` | acc-600 / 700 / 800 | acc-300 / 200 / 400 | primary button, selected month, toggles on |
| `--accent-knockout` | paper-0 | ink-975 | content on the accent fill |
| `--accent-text` | acc-600 | acc-300 | links, text buttons, active tab label |
| `--accent-soft` / `--accent-soft-ink` | acc-100 / acc-700 | acc-900 / acc-200 | in-progress pills, filter chips on |
| `--accent-line` | acc-300 | acc-700 | tab indicator track, progress |
| `--{ok,wa,er}-fill` | ok-600 · wa-500 · er-600 | ok-300 · wa-300 · er-300 | solid status (rare: destructive button, count badge) |
| `--{ok,wa,er}-knockout` | paper-0 · **ink-900** · paper-0 | ink-975 ×3 | content on the status fill. Warning knockout is dark in both modes |
| `--{ok,wa,er}-soft` | ok-50 · **wa-100** · er-50 | ok-900 · wa-900 · er-900 | pill and inline-alert background |
| `--{ok,wa,er}-soft-ink` | ok-700 · wa-700 · er-700 | ok-300 · wa-300 · er-300 | text and icons on soft, and status text on the sheet |
| `--{ok,wa,er}-border` | ok-300 · wa-300 · er-300 | ok-700 · wa-700 · er-700 | invalid-field underline (er), knockout border [107] |
| `--focus-ring` | acc-600 | acc-300 | 2 px ring, 2 px offset in `--surface-sheet` |
| `--focus-ring-knockout` | paper-0 | ink-975 | focus on inverse/toast and on solid fills inside them |
| `--selection-bg` / `-ink` | acc-100 / ink-900 | acc-900 / paper-100 | `::selection` |
| `--viz-23 … --viz-np` | acc-600, acc-400, acc-200, ink-450, paper-300, paper-200 | acc-300, acc-500, acc-700, ink-600, ink-700, ink-800 | rate bar segments 23 / 8 / 5 / 0 / zw / np |

**Contrast, WCAG 2.x, computed:**
| pair | light | dark |
|---|---|---|
| ink-1 on sheet | 16.4 | 16.5 |
| ink-1 on overlay / desk | 17.3 / 14.5 | 14.4 / — |
| ink-2 on sheet | 6.1 | 10.0 |
| ink-3 on sheet / sunken / overlay | 4.9 / 4.7 / 5.2 | 6.0 / — / 5.2 |
| accent-text on sheet / desk | 6.0 / 5.4 | 8.9 / — |
| accent-knockout on accent-fill (rest / hover) | 6.4 / 8.5 | 9.3 / — |
| accent-soft-ink on accent-soft | 6.9 | 9.9 |
| ok / wa / er soft-ink on soft | 6.8 / 5.1 / 6.7 | 7.8 / 8.4 / 7.2 |
| er-soft-ink (error text) on sheet | 7.0 | 8.4 |
| toast action (acc-300 on inverse / acc-700 on inverse) | 8.3 | 7.7 |
| ok / wa / er knockout on fill | 5.1 / 7.4 / 5.3 | 10.4 / 11.6 / 9.4 |
| line-control on sheet / sunken (3:1 non-text) | 3.4 / 3.2 | 5.1 |
| focus-ring on sheet | 6.0 | 8.9 |
| ink-inverse on surface-inverse | 16.4 | 16.4 |

Rules that follow from the table:
- `ink-3` is never placed on `surface-desk` or `surface-pressed`: it measures 4.4 there. Use `ink-2` on those surfaces.
- `line-subtle` is decorative (1.24). It never carries meaning on its own.

## 4. Typography (CD: the course gives no scale [5])

| role | family (next/font/google) | config |
|---|---|---|
| display | **Newsreader**, variable `wght` 200–800 + `opsz` 6–72 | `Newsreader({ subsets: ["latin","latin-ext"], axes: ["opsz"], style: ["normal"], variable: "--font-newsreader" })` |
| text / UI | **IBM Plex Sans**, variable `wght` 100–700 | `IBM_Plex_Sans({ subsets: ["latin","latin-ext"], weight: ["400","500","600"], variable: "--font-plex" })` |
| mono (outlier) | **IBM Plex Mono** | `IBM_Plex_Mono({ subsets: ["latin","latin-ext"], weight: ["400","500"], variable: "--font-plex-mono" })`. Used only for the KSeF number, the UPO hash and kbd |

Why these faces:
- Newsreader at optical size 72 is sharp and newspaper-like. It gives money the "printed ledger" voice, and `opsz` tracks the size automatically (`font-optical-sizing: auto`).
- Plex Sans has real tabular figures, a slashed-zero option, sturdy Polish diacritics (ą ę ł ź ż) and a technical, accounting-honest tone.
- Fonts not used: Geist (the baseline), Inter, and Fraunces/Instrument Serif (the reflex "AI editorial" serifs).
- Headings are always roman; no italic headings.

`@theme`: `--font-display: var(--font-newsreader), ui-serif, Georgia, serif; --font-sans: var(--font-plex), ui-sans-serif, system-ui, sans-serif; --font-mono: var(--font-plex-mono), ui-monospace, monospace;`

**Scale.** Sizes are given as px; in code they are rem (16px = 1rem). "lh" is line height, "trk" is letter-spacing.
| token | use | 1440 (≥1024) | 375 (<768) | weight | trk |
|---|---|---|---|---|---|
| `text-hero` | "VAT do zapłaty" amount | 72 / lh 1.0 | 48 / lh 1.0 | display 500 | −0.025em |
| `text-display-1` | page title, period title (mobile) | 40 / 1.05 | 28 / 1.1 | display 500 | −0.02em |
| `text-display-2` | sheet/dialog titles, detail gross amount | 28 / 1.15 | 24 / 1.15 | display 500 | −0.015em |
| `text-display-3` | secondary amounts (należny/naliczony), empty-state title | 22 / 1.2 | 20 / 1.2 | display 500 | −0.01em |
| `text-title` | row primary (counterparty), section heads inside sheets | 15 / 1.35 | 16 / 1.35 | sans 600 | −0.005em |
| `text-body` | body, menu items, buttons | 15 / 1.5 | 16 / 1.45 | sans 400 / 500 | 0 |
| `text-small` | meta, NIP, captions, table header | 13 / 1.4 | 13 / 1.4 | sans 400 / 500 | 0.005em |
| `text-micro` | count badges, kbd only | 11 / 1.2 | 11 / 1.2 | sans 600 | 0.02em |
| `text-mono` | KSeF number, hash | 13 / 1.4 | 13 / 1.4 | mono 400 | 0 |

- Inputs are **16px on touch** (`pointer: coarse`), so iOS doesn't zoom.
- Between 768 and 1023, display sizes step linearly with `clamp()`. Example: `--hero-size: clamp(3rem, 2rem + 3.2vw, 4.5rem)`.
- Numerals:
  - tables, totals, the pager and dates use `font-variant-numeric: tabular-nums lining-nums`;
  - hero and display amounts use `proportional-nums lining-nums`;
  - the `zero` feature (slashed zero) is on only in the mono role.
- No uppercase labels or eyebrows, and no letter-spacing above 0.02em. The company eyebrow above the title is `text-small` in `ink-2`, sentence case.
- Measure: running text max 64ch (empty states, error copy, help text).

## 5. Spacing, layout, grid (CD)

**Scale:** Tailwind's 4 px base (`--spacing: 0.25rem`). The allowed steps are 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 (= 4…96 px). Anything else is a magic number [134].
Semantic aliases:
| token | 375 | 768 | 1440 | use |
|---|---|---|---|---|
| `--gutter` | 16 | 24 | 48 | sheet inner padding (left/right) |
| `--stack-section` | 28 | 40 | 48 | between page bands (header → summary → register) |
| `--stack-group` | 16 | 20 | 24 | inside a band |
| `--stack-tight` | 4 | 4 | 6 | label ↔ value |
| `--row-h` | 64 (list) | 56 | 56 | data row minimum height |
| `--control-h` | 44 | 40 | 40 | buttons, inputs, search (`pointer: coarse` → 44 everywhere) |

**Breakpoints and shell:**
| range | shell | register body |
|---|---|---|
| < 768 (phone) | top bar 52 + bottom nav 56 + safe area; the sheet is full-bleed, no desk visible | day-grouped list, FAB |
| 768–1023 | 72 px icon rail on the desk; sheet with radius 24 on the left | table; Identyfikator + Netto hidden |
| 1024–1279 | 248 px sidebar; sheet inset 8 px top/right/bottom, radius 24 | table; Identyfikator hidden |
| ≥ 1280 | same; content fills the sheet (fluid, `--gutter` both sides); the attention line moves beside the hero as a two-line block | full table; Kontrahent capped at `minmax(14rem, 26rem)` |
| table container ≥ 1400 | — | extra width becomes data, not air: Stawka VAT column on by default, the KSeF number shown in full (no truncation); leftover width is split evenly as column gap |

- At 1440 the sheet is 1440 − 248 − 8 = 1184 px wide, with 48 px gutters, so the content is 1088 px. Content never centres in a void. No single column may absorb more than ~200 px of slack: wide screens earn more columns (Stawka, full KSeF number), not wider gaps inside one cell.
- The table **uses container queries** on the register band, not viewport media queries. The detail panel overlays the table and doesn't squeeze it.
- Degrading from 1440 to 375, in order:
  1. Identyfikator column hides;
  2. Netto hides;
  3. KSeF collapses to icon + status (number moves to detail);
  4. below 768 the list replaces the table;
  5. the sidebar becomes the rail, then the bottom nav;
  6. the hero drops from 72 to 48;
  7. the summary totals wrap to two lines;
  8. the rate legend folds into "Stawki ›".

## 6. Radius, elevation, lines

| token | value | use |
|---|---|---|
| `--radius-xs` | 4 | kbd, checkbox, rate-bar ends |
| `--radius-sm` | 8 | chips inside inputs, menu items, table row hover |
| `--radius-md` | 12 | buttons, inputs, search, toasts |
| `--radius-lg` | 18 | popovers, menus, inline alerts |
| `--radius-xl` | 24 | the sheet, side panels (leading edge), dialogs, drawer top corners |
| `--radius-pill` | 999 | status pills, filter chips, count badges, FAB |

CD: one deliberate jump (12 → 18 → 24) instead of shadcn's linear `calc(var(--radius) * n)` ladder.

Elevation: surfaces get lighter as they rise in dark mode, and shadows are warm-tinted in light mode.
| token | light | dark |
|---|---|---|
| `--shadow-sheet` | `0 0 0 1px oklch(0.30 0.03 70 / 0.04), 0 1px 2px oklch(0.30 0.03 70 / 0.05)` | `inset 0 1px 0 oklch(1 0 0 / 0.04)` |
| `--shadow-raised` | `0 1px 2px oklch(0.30 0.03 70 / 0.06), 0 8px 24px -8px oklch(0.30 0.03 70 / 0.14)` | `inset 0 1px 0 oklch(1 0 0 / 0.05), 0 8px 24px -8px oklch(0 0 0 / 0.5)` |
| `--shadow-overlay` | `0 2px 6px oklch(0.25 0.03 70 / 0.06), 0 24px 64px -16px oklch(0.25 0.03 70 / 0.24)` | `inset 0 1px 0 oklch(1 0 0 / 0.06), 0 24px 64px -16px oklch(0 0 0 / 0.7)` |
| `--shadow-fab` | `0 6px 20px -6px oklch(0.50 0.215 272 / 0.45)` | `0 6px 20px -6px oklch(0 0 0 / 0.6)` |

Levels:
- desk: no shadow;
- sheet: `shadow-sheet`;
- sticky toolbar and detail panel: `shadow-raised`;
- popover, menu, dialog and drawer: `shadow-overlay`.

Nothing else casts a shadow. Cards don't exist.

**Lines.** `--line-subtle` 1 px is allowed only in five places:
1. between table rows (inset: it starts at the first cell's text, not at the edge);
2. under the table header row;
3. between the header and body of a scrolling sheet *only while content is scrolled under it* (a scroll-driven shadow is better);
4. between the sidebar footer and the nav;
5. between accordion rows in a sheet (Dostępność obszarów).

`--line-control` is the 1 px **bottom** line of inputs. No other borders exist: no tab track line, no card outline, no toolbar border, no table frame.

## 7. Motion (CD: the course has no principles [8])

| token | value | what |
|---|---|---|
| `--dur-press` | 80ms | button press (`scale(0.98)` on primary only) |
| `--dur-fast` | 140ms | hover colours, chip toggle, checkbox |
| `--dur-base` | 200ms | popover/menu in, tab indicator, accordion |
| `--dur-slow` | 280ms | side sheet / dialog in |
| `--dur-drawer` | 400ms | vaul drawer (its own spring-like curve) |
| `--dur-flash` | 1200ms | new/updated row highlight fade-out |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | everything that enters |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | exits: 0.75 × the enter duration |
| `--ease-in-out` | `cubic-bezier(0.6, 0, 0.2, 1)` | tab indicator, position changes |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | vaul |

**What animates.** Only `opacity` and `transform`, plus colour on hover:
- popovers: fade in with a 4 px slide from the trigger side;
- sheets: slide in from the edge;
- tab indicator: slides;
- hero amount on period change: crossfade with a 6 px rise, the old value fading out first;
- KSeF processing: a rotating arc;
- skeleton: an opacity pulse of 0.55 ↔ 1 over 1.6 s;
- new row: `surface-selected` background fading to transparent over `--dur-flash`.

**What never animates:**
- focus rings: they appear instantly;
- layout properties (width, height, top);
- table sorting and filtering: rows swap instantly and the count updates;
- numbers: they don't count up;
- page load: no fade-ups on scroll and no staggered entrances;
- hover: no scale;
- no bounce or overshoot anywhere.

**Reduced motion** (`prefers-reduced-motion: reduce`):
- every slide becomes a 120 ms opacity fade;
- the drawer opens without travel;
- the skeleton is static at 0.7 opacity;
- the processing arc becomes a static clock icon;
- the flash becomes a static highlight that clears after 2 s.

`transition-all` is banned. List the properties.

## 8. Component recipes

The common state set applies everywhere unless a row overrides it:
- **hover** (pointer: fine only): one surface step up, `--dur-fast`;
- **focus-visible**: `outline: 2px solid var(--focus-ring); outline-offset: 2px`, instantly. On `surface-inverse` and on solid fills use `--focus-ring-knockout`;
- **active**: `surface-pressed`;
- **disabled**: `ink-disabled`, no hover, `cursor: not-allowed`, and a tooltip with the reason when the reason isn't obvious;
- **loading**: the label stays, a 14 px arc replaces the icon, `aria-busy`, the control keeps its width;
- **error**: `er-soft-ink` text and message, plus `er-border` on controls.

### Buttons (build after chips and pills [155])
| variant | rest | hover | active | notes |
|---|---|---|---|---|
| **primary** | `accent-fill` / `accent-knockout`, radius-md, h `--control-h`, px 16, sans 500 | `accent-fill-hover` | `accent-fill-active` + scale .98 | **One per view.** "Dodaj dokument", or the main action of a sheet. Its focus ring sits on the offset gap, so it reads on the fill |
| **secondary** | `surface-sunken` / `ink-1` | `surface-pressed` | `surface-pressed` | "Filtry", "Anuluj", "Drukuj" |
| **ghost** | transparent / `ink-2` | `surface-hover` / `ink-1` | `surface-pressed` | toolbar icons, ⋯, stepper arrows. An icon-only ghost is 40 px square (44 on touch) with an `aria-label` |
| **text** | `accent-text`, no padding, underline on hover (1 px, offset 3) | underline | `accent-fill-active` colour | inline actions: "Potwierdź okres", "Pokaż", "Wyczyść wszystko" |
| **danger** | `er-fill` / `er-knockout` | er-700 (light) / er-500 (dark) | — | only inside a confirm for irreversible actions. Delete is undo-able, so it uses a ghost button in `er-soft-ink` |

- Loading: "Zapisywanie…" with the arc.
- Disabled primary: `surface-sunken` / `ink-disabled`, never faded accent.
- Icons are lucide at 18 px with stroke 1.75, `ink-2` (inherited on filled buttons).

### Inputs: the "ledger line" field (CD)
- Construction:
  - fill `surface-sunken`, radius-md top corners only (`12 12 0 0`), plus a 1 px bottom `line-control`;
  - h 44 (also on desktop: forms are touch-first);
  - label above in `text-small` 500 `ink-2`;
  - help/error text below in `text-small`.
- States:
  - hover: line → `ink-2`;
  - focus-visible: the bottom line becomes 2 px `focus-ring` plus the standard outline ring at offset 2;
  - error: bottom line 2 px `er-border` → `er-soft-ink`, message `er-soft-ink` with an alert icon, `aria-invalid` + `aria-describedby`;
  - disabled: fill transparent, line dashed `line-subtle`;
  - read-only (confirmed period): no fill, value in `ink-1`, the line is gone;
  - success (NIP checksum ok): a 16 px check in `ok-soft-ink` inside the field on the right; no green line.
- Amount inputs:
  - right-aligned, tabular, "zł" suffix in `ink-3`;
  - accept "1 234,56", "1234.56" and "1234,5"; reformat on blur.
- Date input: displayed as `dd.mm.rrrr`, opens the calendar popover. There is no native date picker.

### Search
- `surface-sunken`, radius-md **all corners** (search is not a form field, so no ledger line), h `--control-h`, leading icon `ink-3`.
- Placeholder "Szukaj: kontrahent, NIP, numer, KSeF".
- Trailing kbd `/` on fine pointers.
- Clear ✕ appears once there is a value.
- States:
  - focus: fill `surface-raised` + ring;
  - loading (server): arc replaces the search icon;
  - error: none (the search degrades to local filtering).
- Width: 360 at ≥1024; flex-1 on phone.

### Chips (filter chips and toggle chips)
- **Active-filter chip:**
  - `accent-soft` / `accent-soft-ink`, radius-pill, h 32 (36 touch), px 12, `text-small` 500;
  - format "Rodzaj: Korekta", with a trailing ✕ in a 24 px hit area. The ✕ has `aria-label "Usuń filtr Rodzaj: Korekta"`;
  - hover: ✕ circle `accent-line`.
- **Toggle chip** (inside the filters sheet):
  - off: `surface-sunken` / `ink-1`;
  - on: `accent-fill` / `accent-knockout` with a check icon;
  - focus ring standard;
  - disabled when the option has 0 matches: `ink-disabled` + the count "0".
- Each toggle chip shows a count in `ink-3` (`accent-knockout` at 70% when on).

### Tabs (Sprzedaż / Zakupy)
- Text tabs with no track line:
  - label `text-title` (sans 600 15/16);
  - inactive `ink-2`, hover `ink-1`;
  - active `ink-1` with a 2 px `accent-fill` bar under the label text only, sliding (`--dur-base`, ease-in-out).
- Count after the label in `text-small` tabular `ink-3`, plain text (no pill): "Sprzedaż 24".
- Full name "Rejestr VAT sprzedaży" goes in `aria-label` and `title` (B6).
- Focus ring around the label; arrow-key navigation (Radix).

### Segmented control (theme, sort, page size on phone)
- Track `surface-sunken`, radius-md; the selected segment `surface-raised` + `shadow-raised` (the one allowed in-flow shadow), `ink-1`; others `ink-2`.
- Height 36 (44 touch).

### Menus and popovers (⋯, row menu, company, user, notifications)
- `surface-overlay`, radius-lg, `shadow-overlay`, padding 6, min-w 240.
- Items: h 36 (44 touch), radius-sm, px 10, `text-body`, icon 18 `ink-2`, shortcut on the right in `text-small` `ink-3`.
- Item states: hover/highlight `surface-hover`; destructive item `er-soft-ink`; disabled `ink-disabled` + reason as a second line.
- Group labels in `text-small` 500 `ink-3`, sentence case.
- Separators: none; groups are split by 6 px of space.
- Enter: fade + 4 px slide, `--dur-base`.
- **On phones every menu becomes a bottom drawer.**

### Sheets, drawers, dialogs
| kind | where | spec |
|---|---|---|
| **side panel** (detail, filters on 768–1023, add/edit, KSeF triage, JPK, readiness) | ≥768 | right edge, w 480 (form 560), `surface-overlay`, radius-xl on the leading corners, `shadow-overlay`, **no scrim** for the detail panel (non-modal, the table stays usable), scrim for forms. The header has a `text-display-2` title, a meta line and 40 px ghost close/prev/next. The footer is sticky with the actions right-aligned and primary last |
| **bottom drawer** (vaul) | <768 | `surface-overlay`, radius-xl top, grab handle 36×4 `line-subtle`, max-h 92dvh, footer pinned above the safe area, scrim |
| **dialog** | all | only for "Potwierdź okres" and discard-unsaved-changes. w 480, centred, radius-xl, scrim. On phones it becomes a bottom drawer |

All three trap focus (except the non-modal detail), close on Esc, and return focus to the trigger.

### Status pills: "only exceptions get colour" (CD)
Healthy states are quiet text and problems are pills. A table full of green "Przyjęta" pills is noise.
| status | rendering |
|---|---|
| quiet | 16 px icon + `text-small` label, no background |
| pill | radius-pill, h 24, px 8, `text-small` 500, icon 14, `{status}-soft` / `{status}-soft-ink` |

| domain | value | form | colour | icon |
|---|---|---|---|---|
| KSeF | `not_sent` Nie wysłana | quiet | `ink-2` | circle-dashed |
| KSeF | `queued` W kolejce | pill | accent-soft | clock |
| KSeF | `processing` Przetwarzanie | pill | accent-soft | arc (animated) |
| KSeF | `accepted` Przyjęta | quiet | `ok-soft-ink` | check |
| KSeF | `rejected` Odrzucona | pill | er-soft | alert-octagon |
| KSeF | `outside` Poza KSeF | quiet | `ink-3` | minus |
| Period | Otwarty | quiet in the status line | `ink-2` | circle |
| Period | Wymaga potwierdzenia | quiet in the status line, `wa-soft-ink` | warning | alert-triangle |
| Period | Potwierdzony | quiet, `ok-soft-ink` | success | lock |
| JPK | Do wysłania · do 25.11 | quiet, `ink-2`. Within 5 days of the deadline it becomes `wa-soft-ink` | — | calendar |
| JPK | Wysłany 20.10 · UPO | quiet, `ok-soft-ink` | — | check |
| JPK | Przyszły | `ink-3` text "—" | — | — |
| Area readiness | Gotowy / Wymaga konfiguracji / Niedostępny | pill: ok / wa / neutral (`surface-sunken` / `ink-2`) | | |

Colour is never the only signal: every status has an icon and a word.

### Table rows (≥768)
- Header:
  - `text-small` 500 `ink-2`, h 40, sticky under the toolbar on `surface-sheet`, plus the `line-subtle` bottom;
  - sortable headers are buttons: hover `ink-1`, active sort shows an arrow ↑/↓ in `accent-text`, `aria-sort`.
- Rows:
  - h `--row-h` 56, two-line cells: primary `text-body` `ink-1` / secondary `text-small` `ink-2`;
  - amounts right-aligned, tabular, **no "zł" in cells** (the header says "Brutto, zł").
- Row states:
  - hover `surface-hover` with radius-sm (the highlight floats, inset 4 px horizontally);
  - focus-visible: ring on the row (roving tabindex, ↑/↓);
  - selected (detail open) `surface-selected`;
  - checked (bulk) `surface-selected` + checkbox on;
  - read-only period: the same, but the row ⋯ menu shows only Podgląd / Drukuj;
  - loading: skeleton rows (§ Skeletons).
- Checkbox column (28 px):
  - pointer: visible on row hover or once any row is checked;
  - keyboard: always in the tab order;
  - touch: long-press a list row.
- Row ⋯ appears on hover/focus and is always visible on touch.
- No zebra, no cell borders.

### List rows (<768)
- Grouped by day:
  - the group header is a sticky `text-small` 500 `ink-2` on `surface-sheet`: "Pon, 25 października";
  - the day's VAT total sits on the right in `ink-3`, tabular.
- Row, min-h 64, padding-block 12:
  - line 1: counterparty `text-title`, with gross on the right in tabular 500;
  - line 2: number · document type in `text-small` `ink-2`, with the KSeF status (quiet or pill) on the right.
- The whole row is one button that opens the detail drawer. Press: `surface-pressed`. No chevrons.
- Separators: `line-subtle`, inset 16 px.

### Toasts (sonner, restyled)
- `surface-inverse` / `ink-inverse`, radius-md, `shadow-overlay`, padding 12×16, max-w 420, `text-body`.
- Action button is a text button in acc-300 (light mode) / acc-700 (dark mode); focus uses `--focus-ring-knockout`.
- Placement:
  - bottom-right, 24 px in, on desktop;
  - bottom-centre above the bottom nav (+12) on phones.
- Variants by icon only:
  - success: no icon (silent success);
  - error: alert icon in `er-300` / `er-700`;
  - undo: has a 6 s countdown bar in `accent-line`.
- Toasts never shift layout and never stack beyond 2.

### Inline alert / attention line
- One line, `wa-soft` or `er-soft`, radius-lg, px 16, h 48 (wraps on phone), icon + **bold count** + reason in `{s}-soft-ink`, and a text-button action right-aligned in `ink-1`.
- No dismiss ✕. It disappears when the problem is resolved.

### Skeletons
- `surface-pressed` blocks (sunken is invisible on the sheet) with radius-xs, shaped exactly like the content:
  - hero: one 280×56 block (48×200 on phone);
  - table: 8 rows of two bars (60% / 35%) plus right-aligned 80 px bars.
- Pulse per §7. Labels that are known before data (tabs, headers, titles) render as real text, not skeletons.
- `aria-busy` on the region, with "Wczytywanie rejestru…" for screen readers.

### Empty, no-results and error blocks
All three share one layout: left-aligned in the register band, not centred in a void.
- Title in `text-display-3`, then one sentence in `text-body` `ink-2` (max 56ch), then actions. Padding-block 48, or 32 on phone.
- A single 40 px line icon in `ink-3` above the title. No illustrations.

| block | title | body | actions |
|---|---|---|---|
| empty register | "Brak dokumentów w październiku" | "W rejestrze sprzedaży nie ma jeszcze żadnej faktury za ten okres." | primary "Dodaj dokument" · text "Przejdź do września" |
| empty period (future) | "Listopad jeszcze się nie zaczął" | "Dokumenty z datą w listopadzie pojawią się tutaj." | text "Wróć do października" |
| no results | "Nic nie pasuje do filtrów" | "Szukasz „{q}” w {n} dokumentach z filtrami: {chips}." | secondary "Wyczyść filtry" · text "Szukaj we wszystkich okresach" (only if search exists across periods; otherwise omit) |
| error (load) | "Nie udało się wczytać rejestru" | "Sprawdź połączenie i spróbuj ponownie. Dane, które wpisałeś, są bezpieczne." | primary "Spróbuj ponownie" (loading state while retrying) · `text-small` `ink-3` "Kod: {code}" |

The error state keeps the shell, the period header and the tabs. **The baseline showed a blank page on error, which is a P1 defect.**

### Amount formatting (`<Money>`)
- Format: pl-PL. The thousands separator is a narrow no-break space (U+202F), the decimal separator is a comma, and the minus is a true minus (U+2212).
- Variants:

| variant | integer | ",dd" | "zł" |
|---|---|---|---|
| hero | `text-hero` `ink-1` | same face at **0.5em**, `ink-3`, baseline-aligned | sans 400, 0.3em, `ink-3`, gap 0.15em |
| display (2/3) | `ink-1` | 0.6em `ink-3` | sans 0.45em `ink-3` |
| table / list | tabular, 100% size, `ink-1` | **same size**, `ink-3` (keeps column alignment) | omitted; the header carries the unit |
| inline text | as the text | as the text | "zł" in the same colour |

- Zero: "0,00" entirely in `ink-3`.
- Negative (correction): a true minus in `ink-1`. Not red, because a correction isn't an error.
- `aria-label` reads the full value: "−2 349,30 zł".

### Kbd hint
`surface-sunken`, radius-xs, mono 11, `ink-2`, px 5. Shown only on `pointer: fine`.

## 9. Considerations (the last line of defence [155])

**Do**
1. Use Tier-2 utilities only. If you need a colour that doesn't exist, add a Tier-2 token here first, then in `globals.css`.
2. One primary button per view. Everything else is secondary, ghost or text.
3. Show status by exception: healthy is quiet, problems get a pill. Every status has icon + word.
4. Amounts: tabular in tables, display face in heroes, decimals and "zł" in `ink-3`. Use the `<Money>` component; no hand-formatting.
5. Every screen ships filled, empty, no-results, error and loading states. Error keeps the context visible.
6. Every overlay becomes a bottom drawer below 768. Every control is ≥44 px on `pointer: coarse`.
7. Keep content left-aligned on the sheet. Air comes from `--stack-*` tokens, not from centring.
8. Polish copy in sentence case. Use the original's terms: Rejestr VAT sprzedaży, Numer KSeF, Identyfikator, Kod JPK V7, Rodzaj operacji, Serie dokumentów.
9. Group thousands with `useGrouping: "always"` (4-digit amounts too, so columns align) and render the separator with a real glyph (U+00A0 inside a span with `margin-inline: var(--money-group-gap)`). U+202F has no glyph in Newsreader/Plex and collapses to nothing.
10. Never let "zł" or decimals render below 11 px: `font-size: max(<em>, 0.6875rem)`.
11. An initials avatar always has its own chip one surface step away from what it sits on: `bg-surface-sheet` on the desk, `bg-surface-sunken` on the sheet. Initials are never bare text.
12. A truncated label is a defect. If label + value don't fit, drop the label and keep the value (e.g. "Demo: Ładowanie").
13. At rest, the phone FAB must not cover any interactive control. Disclosure toggles ("Stawki ⌄", "Pokaż") go at the inline start, never at the bottom-right of a band.
14. Floating bars (selection bar, FAB) sit below every overlay: `z-index` under `--scrim`, and they are hidden while a modal sheet is open. When the selection bar shows, the register band gains bottom padding equal to its height + 24 px, so the pager stays reachable.
15. Polish counts after "z" take the genitive plural: "3 z 24 dokumentów", "1–10 z 24 zapisów". Use the `plural()` helper with an explicit genitive form.
16. Toasts never sit on top of a footer control (pager, sheet footer). On desktop, with a side panel open, offset the toaster to the left of the panel (`right: calc(var(--sheet-w) + 24px)`). Without a panel, raise it above the register footer (`bottom: 72px`).

**Don't**
1. No borders for grouping. If two things need separating, use space (`--stack-group`); a hairline is allowed only in the five places in §6.
2. No cards and no tiles. No box around the summary, filters or table.
3. No side-stripe colour edges on rows (the baseline's red edge goes).
4. No uppercase eyebrows or labels, no italic headings, no emoji.
5. No `transition-all`, no hover scale, no bounce, no animated focus.
6. No floating "Demo" pill over content (it moves to the sidebar or user menu).
7. No centred empty states with illustrations.
8. No tooltips as the only label. Icon-only buttons need `aria-label`; tooltips show after 600 ms on hover and instantly on focus.
9. No raw hex, oklch, px radius or ms literal in `src/components/**`, and no arbitrary `text-[…em]` / `ml-[…em]` either: add a Tier-3 token. Lint: `grep -rnE "#[0-9a-f]{3,6}|oklch\(|rounded-\[|duration-\[|shadow-\[" src/components` must be empty.

**shadcn defaults that must not survive** (each one is a defect on sight):
- `--radius: 0.625rem` and the `calc(var(--radius) * n)` ladder → use §6.
- `border` / `border-input` on Input, Select and Textarea → ledger line.
- `shadow-xs` on inputs and buttons.
- Black `bg-primary` buttons; `variant="outline"` buttons with 1 px borders.
- Badge default (`rounded-md border px-2 py-0.5 text-xs font-medium`) → status pills §8.
- Tabs default (`bg-muted` track with a white raised trigger) → text tabs §8. The segmented style is reserved for settings.
- Table default (`border-b` on every row, `hover:bg-muted/50`, `h-10` header) → §8.
- Card (`rounded-xl border py-6 shadow-sm`) → not used at all.
- Sheet default (`border-l`, 75% width, ✕ in the corner at 4 px opacity 70) → side panel §8.
- Dialog default overlay `bg-black/50` → `--scrim`.
- DropdownMenu `-mx-1 my-1 h-px bg-border` separators → spacing.
- Focus `ring-[3px] ring-ring/50` → 2 px solid `--focus-ring`, offset 2.
- Sonner default white toast with border → inverse toast.
- Skeleton `bg-accent animate-pulse` → §8 skeleton.
- Geist, and `text-muted-foreground` as the universal grey → `ink-2` / `ink-3` by role.

## 10. Craft decisions log (not from the course)
- Warm paper + cool ink as two ramps (§2).
- Ultramarine as the single accent; info merged into the accent.
- Newsreader + IBM Plex Sans + Plex Mono, and the full type scale (§4).
- Layout grid, breakpoints, container-query column dropping (§5).
- Radius jump, warm shadows, lighter-surface elevation in dark mode (§6).
- All motion tokens and rules (§7).
- Ledger-line inputs.
- "Only exceptions get colour".
- Same-size decimals in tables.
- Empty/error block layout (§8).

Contrast values were computed with the WCAG 2.x relative-luminance formula; APCA [165] was not used.
