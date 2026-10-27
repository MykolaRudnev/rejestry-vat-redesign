# Test task: "Rejestry i VAT" screen redesign (SaaS startup, frontend role)

Deadline: Fri 30.10.2026. Deliverables: a public Vercel demo plus a public GitHub repo (Mikki creates/connects the accounts himself).

## Brief (from the client, translated)
Adapt and improve one screen of their app: "Rejestry i VAT" (an accounting app, Polish UI). The references are desktop screenshots with demo data. Make it simpler, more convenient and cleaner:
- clear at first glance, needing no explanation;
- simple and logical: the main things are visible, nothing extra;
- clean: show only the key functionality at first, with secondary things hidden in menus/functions;
- NO field and NO action may be lost;
- working states: filled, empty (no data), error;
- a working demo prototype (behaviour can be clicked through);
- adaptive: desktop + iPhone SE (375×667), smooth when the window narrows;
- not a copy with small edits but an original, modern and unique vision.

The references (thumbnails only so far; Mikki has the full-size screenshots in Telegram and will drop them into `refs/`):
1. "Witaj, Preview Reviewer!" / "Obszary księgowe" page: a warning banner, a "Okres księgowy – 2026" card, a "Dostępność obszarów" list with links (Rejestr VAT, JPK, Ewidencja przychodów, Płace/Księgi?, Majątek, Kontrahenci…), and bottom tabs including "Rejestry i VAT".
2. The "Rejestry i VAT" register: a header with tabs, a warning banner, a filter row (several selects/inputs), 3 summary tiles with amounts (netto / VAT / brutto style), a progress bar, and a dense data table (~8 columns: date, numbers, NIP, amounts) with pagination.
Mikki's direction: get rid of the heavy borders/boxes, make it readable and usable for money data (invoices, payments, integrations), and make it great on the phone.

## Proposed approach
Stack: Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui (Radix) for accessible primitives, lucide icons, TanStack Table for the desktop table, mock data in typed JSON plus a fake async API with a selectable state (filled / empty / error / loading) via a query param `?state=` and a small dev switcher. No backend, but data access sits behind one `lib/api.ts` so it's ready to plug into a real backend later. Deploy on Vercel.

### UX ideas (the agent should refine them)
- Inventory first: list every field and action from the refs in `docs/inventory.md` and map each to where it lives in the new UI. This is the proof that "nothing was lost".
- Layout: a slim top bar (period picker for the "Okres księgowy", the company, the user), a page title, and one primary action (e.g. "Dodaj dokument"/import); secondary actions go in a "…" menu.
- Summary: 3 KPI numbers (netto, VAT, brutto or VAT należny/naliczony/do zapłaty) as plain typography, no boxes; a subtle progress indicator for the period status.
- Filters: a search field plus 1–2 key filters visible; the rest in a "Filtry" sheet (a drawer on mobile, a popover on desktop); active filters shown as removable chips.
- Table on desktop: no cell borders, zebra/hover rows, right-aligned tabular-nums amounts, PLN formatting `pl-PL`, sticky header, row click opens a detail side panel; row actions in a kebab menu.
- Mobile (375px): the table becomes a list of cards (counterparty + date on the left, gross amount on the right, status pill), filters in a bottom sheet, the primary action as a sticky bottom button, and the detail as a full-screen sheet.
- States: a skeleton for loading; an empty state with an illustration-free icon, one sentence and a CTA; an error state with a clear message and "Spróbuj ponownie"; field-level validation errors in forms.
- The warning banner becomes a dismissible inline alert with one clear action.
- Polish UI copy, short. Accessibility: keyboard nav, focus rings, contrast AA, aria labels.
- Visual: a calm neutral palette, one accent colour, an 8px spacing grid, Inter/Geist font, light theme first (dark optional only if time allows).

### Milestones
1. A detailed plan + inventory + wireframe notes (`docs/PLAN.md`, `docs/inventory.md`), for Mikki's review.
2. Scaffold: Next.js + Tailwind + shadcn, the folder structure, the mock data, the fake API with states, the layout shell, lint/format, a README.
3. Desktop register screen (summary, filters, table, detail panel).
4. Mobile layouts + the narrowing behaviour.
5. All states + the dev state switcher + polish/animations (subtle).
6. QA at 375/768/1280/1440, Lighthouse, then the README with design decisions (what changed and why; that becomes the explanation for the client).
7. GitHub + Vercel (Mikki's accounts).

## Rules for this job
- Location: Mikki's Ubuntu PC, `~/Projects/rejestry-vat-redesign` (a new, separate repo).
- Code is written only by the Cursor agent CLI; Claude CLI does a review-only self-check after each step; nobody writes code by hand.
- `git init` is fine, but commits happen only on Mikki's command. No GitHub/Vercel push or accounts: Mikki does the logins.
- This turn's scope: the detailed plan (milestone 1) + the base structure (milestone 2) only. Stop there and report.
