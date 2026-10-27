"use client";
import { useMemo, useState, type ReactNode } from "react";
import { Check, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { activeFilterCount, applyFilters } from "@/lib/filter";
import { docTypeLabel, docTypes, documentsCount, jpkCodeOptions, plural, ksefLabel, ksefStatuses, vatRateLabel, vatRates } from "@/lib/labels";
import { emptyFilters, type Filters, type RegisterEntry } from "@/lib/types";

export type SortKey = "date-desc" | "date-asc" | "gross-desc" | "gross-asc" | "name-asc";
export const sortLabels: Record<SortKey, string> = {
  "date-desc": "Najnowsze",
  "date-asc": "Najstarsze",
  "gross-desc": "Kwota ↓",
  "gross-asc": "Kwota ↑",
  "name-asc": "Kontrahent A–Z",
};

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const clearKeys = (f: Filters): Filters => ({ ...emptyFilters, q: f.q });

function Group({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn("flex flex-col gap-2.5", className)}>
      <legend className="pb-2.5 text-small font-medium text-ink-2">{title}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function Chip({ pressed, count, onToggle, children }: { pressed: boolean; count: number; onToggle: () => void; children: ReactNode }) {
  return (
    <Toggle pressed={pressed} onPressedChange={onToggle} disabled={!count && !pressed}>
      {pressed && <Check />}
      {children}
      <span className={cn("tnum", pressed ? "opacity-70" : "text-ink-3")}>{count}</span>
    </Toggle>
  );
}

/** All filter groups [B15 B16 B17 + Status KSeF, Stawka VAT]. Counts are per period; empty options are disabled. */
function FilterGroups({ draft, setDraft, entries, twoCol }: { draft: Filters; setDraft: (f: Filters) => void; entries: RegisterEntry[]; twoCol: boolean }) {
  const count = useMemo(() => {
    const c = new Map<string, number>();
    const inc = (k: string) => c.set(k, (c.get(k) ?? 0) + 1);
    for (const e of entries) {
      inc(`d:${e.docType}`);
      inc(`k:${e.ksef.status}`);
      inc(`r:${e.vatRate}`);
      inc(`s:${e.series}`);
      e.jpkCodes.forEach((j) => inc(`j:${j}`));
    }
    return (k: string) => c.get(k) ?? 0;
  }, [entries]);
  const series = [...new Set(entries.map((e) => e.series))].sort((a, b) => (a === "Inne" ? 1 : b === "Inne" ? -1 : a.localeCompare(b)));
  const gtu = jpkCodeOptions.gtu.filter((g) => count(`j:${g}`) || draft.jpk.includes(g));
  const statuses = ksefStatuses.filter((s) => count(`k:${s}`) || draft.ksef.includes(s));

  return (
    <div className={cn("grid gap-x-8 gap-y-6", twoCol && "grid-cols-2")}>
      <Group title="Rodzaj operacji">
        {docTypes.map((t) => (
          <Chip key={t} pressed={draft.docTypes.includes(t)} count={count(`d:${t}`)} onToggle={() => setDraft({ ...draft, docTypes: toggle(draft.docTypes, t) })}>
            {docTypeLabel[t]}
          </Chip>
        ))}
      </Group>
      <Group title="Kod JPK V7">
        {gtu.length === 0 && <span className="text-small text-ink-3">Brak oznaczeń GTU w okresie</span>}
        {[...gtu, ...jpkCodeOptions.procedures.filter((p) => count(`j:${p}`) || draft.jpk.includes(p))].map((j) => (
          <Chip key={j} pressed={draft.jpk.includes(j)} count={count(`j:${j}`)} onToggle={() => setDraft({ ...draft, jpk: toggle(draft.jpk, j) })}>
            {j.replace("_", " ")}
          </Chip>
        ))}
      </Group>
      <Group title="Status KSeF">
        {statuses.map((s) => (
          <Chip key={s} pressed={draft.ksef.includes(s)} count={count(`k:${s}`)} onToggle={() => setDraft({ ...draft, ksef: toggle(draft.ksef, s) })}>
            {ksefLabel[s]}
          </Chip>
        ))}
      </Group>
      <Group title="Stawka VAT">
        {vatRates.map((r) => (
          <Chip key={r} pressed={draft.rates.includes(r)} count={count(`r:${r}`)} onToggle={() => setDraft({ ...draft, rates: toggle(draft.rates, r) })}>
            {vatRateLabel[r]}
          </Chip>
        ))}
      </Group>
      <Group title="Serie dokumentów" className={cn(twoCol && "col-span-2")}>
        {series.map((s) => (
          <Chip key={s} pressed={draft.series.includes(s)} count={count(`s:${s}`)} onToggle={() => setDraft({ ...draft, series: toggle(draft.series, s) })}>
            {s}
          </Chip>
        ))}
      </Group>
    </div>
  );
}

/**
 * "Filtry" [B12]. ≥768: popover, filters apply live behind it. <768: drawer with sort [B27];
 * changes apply on "Pokaż N".
 */
export function FiltersControl({
  filters,
  onChange,
  entries,
  sort,
  onSortChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  entries: RegisterEntry[];
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
}) {
  const desktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [draftSort, setDraftSort] = useState(sort);
  const active = activeFilterCount(filters);

  const trigger = (
    <Button aria-label={active ? `Filtry, aktywne: ${active}` : "Filtry"} className={cn(active > 0 && "bg-accent-soft text-accent-soft-ink hover:bg-accent-soft")}>
      <ListFilter />
      <span className="max-[359px]:sr-only">Filtry</span>
      {active > 0 && <span className="tnum grid h-5 min-w-5 place-items-center rounded-pill bg-accent-fill px-1 text-micro text-accent-knockout">{active}</span>}
    </Button>
  );

  if (desktop) {
    const shown = applyFilters(entries, filters).length;
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="start" aria-label="Filtry" className="max-h-[min(36rem,calc(100dvh-8rem))] w-150 overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-title">Filtry</p>
            <Button variant="text" disabled={!active} onClick={() => onChange(clearKeys(filters))}>
              Wyczyść
            </Button>
          </div>
          <FilterGroups draft={filters} setDraft={onChange} entries={entries} twoCol />
          <p className="tnum mt-5 text-small text-ink-2">
            {shown} z {entries.length} {plural(entries.length, "dokumentu", "dokumentów", "dokumentów")}
          </p>
        </PopoverContent>
      </Popover>
    );
  }

  const shown = applyFilters(entries, draft).length;
  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setDraft(filters);
          setDraftSort(sort);
        }
      }}
    >
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="flex-row items-center justify-between">
          <DrawerTitle>Filtry</DrawerTitle>
          <DrawerDescription className="sr-only">Zawęź listę dokumentów w wybranym okresie.</DrawerDescription>
          <Button variant="text" disabled={!activeFilterCount(draft)} onClick={() => setDraft(clearKeys(draft))}>
            Wyczyść
          </Button>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2.5">
            <legend className="pb-2.5 text-small font-medium text-ink-2">Sortuj</legend>
            <ToggleGroup type="single" value={draftSort} onValueChange={(v) => v && setDraftSort(v as SortKey)} aria-label="Sortuj" className="w-full flex-wrap">
              {(["date-desc", "gross-desc", "name-asc"] as SortKey[]).map((k) => (
                <ToggleGroupItem key={k} value={k}>
                  {k === "date-desc" ? "Data ↓" : k === "gross-desc" ? "Kwota ↓" : "Kontrahent"}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </fieldset>
          <FilterGroups draft={draft} setDraft={setDraft} entries={entries} twoCol={false} />
        </DrawerBody>
        <DrawerFooter>
          <Button
            variant="primary"
            disabled={shown === 0}
            onClick={() => {
              onChange(draft);
              onSortChange(draftSort);
              setOpen(false);
            }}
          >
            Pokaż {documentsCount(shown)}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
