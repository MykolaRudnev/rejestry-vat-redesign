"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import { Lock, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActionMenu, type ActionGroup } from "@/components/ui/action-menu";
import { docTypeLabel, ksefLabel, vatRateLabel } from "@/lib/labels";
import { useIsDesktop } from "@/hooks/use-media-query";
import { emptyFilters, type Filters, type RegisterEntry } from "@/lib/types";
import { FiltersControl, type SortKey } from "./filters-panel";

function chipsOf(f: Filters, onChange: (f: Filters) => void) {
  const drop = <K extends keyof Filters>(k: K, v: string) => () =>
    onChange({ ...f, [k]: (f[k] as string[]).filter((x) => x !== v) });
  return [
    ...f.docTypes.map((v) => ({ key: `d-${v}`, label: `Rodzaj: ${docTypeLabel[v]}`, remove: drop("docTypes", v) })),
    ...f.jpk.map((v) => ({ key: `j-${v}`, label: `Kod JPK: ${v.replace("_", " ")}`, remove: drop("jpk", v) })),
    ...f.ksef.map((v) => ({ key: `k-${v}`, label: `Status KSeF: ${ksefLabel[v]}`, remove: drop("ksef", v) })),
    ...f.rates.map((v) => ({ key: `r-${v}`, label: `Stawka: ${vatRateLabel[v]}`, remove: drop("rates", v) })),
    ...f.series.map((v) => ({ key: `s-${v}`, label: `Seria: ${v}`, remove: drop("series", v) })),
  ];
}

/**
 * Sticky toolbar [B8 B12 B18 + ⋯ B9 B10 B11 B26]. Only search, "Filtry" and "Dodaj" are visible;
 * everything else lives behind ⋯. Gets raised elevation once content scrolls under it.
 */
export const Toolbar = forwardRef<
  HTMLInputElement,
  {
    filters: Filters;
    onChange: (f: Filters) => void;
    entries: RegisterEntry[];
    sort: SortKey;
    onSortChange: (s: SortKey) => void;
    resultLabel: string;
    menu: ActionGroup[];
    onAdd: () => void;
    locked: boolean;
  }
>(function Toolbar({ filters, onChange, entries, sort, onSortChange, resultLabel, menu, onAdd, locked }, ref) {
  const desktop = useIsDesktop();
  const chips = chipsOf(filters, onChange);
  const sentinel = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  // the table header sticks right under the toolbar, whatever its height (chips wrap)
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--toolbar-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: "-60px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden />
      <div
        ref={bar}
        className={cn(
          "no-print sticky top-13 z-20 -mx-(--gutter) flex flex-col gap-3 px-(--gutter) py-2.5 transition-[background-color,box-shadow] duration-(--dur-base) md:top-0",
          stuck ? "bg-surface-raised shadow-raised md:rounded-t-xl" : "bg-surface-sheet",
        )}
      >
        <div className="flex items-center gap-2">
          <label className="flex h-(--control-h) min-w-0 flex-1 items-center gap-2 rounded-md bg-surface-sunken px-3 transition-colors duration-(--dur-fast) focus-within:bg-surface-raised focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring lg:max-w-90">
            <Search className="size-4.5 shrink-0 text-ink-3" />
            <input
              ref={ref}
              type="search"
              value={filters.q}
              onChange={(e) => onChange({ ...filters, q: e.target.value })}
              placeholder={desktop ? "Szukaj: kontrahent, NIP, numer, KSeF" : "Szukaj"}
              aria-label="Szukaj dokumentów"
              className="min-w-0 flex-1 bg-transparent text-body text-ink-1 outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
            />
            {filters.q ? (
              <button
                type="button"
                onClick={() => onChange({ ...filters, q: "" })}
                className="-mr-1 grid size-7 shrink-0 place-items-center rounded-sm text-ink-2 hover:bg-surface-pressed"
                aria-label="Wyczyść wyszukiwanie"
              >
                <X className="size-4" />
              </button>
            ) : (
              <kbd className="hidden shrink-0 rounded-xs bg-surface-pressed px-1.5 font-mono text-micro text-ink-2 fine:inline">/</kbd>
            )}
          </label>
          <FiltersControl filters={filters} onChange={onChange} entries={entries} sort={sort} onSortChange={onSortChange} />
          <p aria-live="polite" className="tnum ml-auto hidden px-2 text-small whitespace-nowrap text-ink-2 lg:block">
            {resultLabel}
          </p>
          <ActionMenu
            title="Więcej akcji"
            groups={menu}
            className="w-72"
            trigger={
              <Button variant="ghost" size="icon" aria-label="Więcej akcji">
                <MoreHorizontal />
              </Button>
            }
          />
          <Button variant="primary" className="max-md:hidden" onClick={onAdd} disabled={locked}>
            {locked ? <Lock /> : <Plus />} Dodaj dokument
          </Button>
        </div>
        {chips.length > 0 && (
          <ul className="flex flex-wrap items-center gap-1.5" aria-label="Aktywne filtry">
            {chips.map((c) => (
              <li key={c.key} className="inline-flex h-8 items-center gap-0.5 rounded-pill bg-accent-soft pr-1 pl-3 text-small font-medium text-accent-soft-ink touch:h-9">
                {c.label}
                <button type="button" onClick={c.remove} aria-label={`Usuń filtr ${c.label}`} className="grid size-6 place-items-center rounded-pill hover:bg-accent-line">
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
            <li>
              <Button variant="text" className="ml-1.5 text-small" onClick={() => onChange({ ...emptyFilters, q: filters.q })}>
                Wyczyść wszystko
              </Button>
            </li>
          </ul>
        )}
      </div>
    </>
  );
});
