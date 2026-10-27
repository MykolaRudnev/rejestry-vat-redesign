"use client";
import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Overlay } from "@/components/ui/overlay";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TODAY } from "@/data/companies";
import { getPeriods } from "@/lib/api";
import { formatPeriod } from "@/lib/format";
import { monthNames } from "@/lib/labels";
import type { Period, PeriodInfo } from "@/lib/types";

export const MIN_PERIOD: Period = { year: 2025, month: 1 };
export const MAX_PERIOD: Period = { year: 2026, month: 12 };

const idx = (p: Period) => p.year * 12 + p.month - 1;
export function shiftPeriod(p: Period, delta: number): Period | null {
  const i = idx(p) + delta;
  if (i < idx(MIN_PERIOD) || i > idx(MAX_PERIOD)) return null;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

const [TY, TM] = TODAY.split("-").map(Number);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const dm = (iso: string) => `${Number(iso.slice(8))}.${iso.slice(5, 7)}`;

function jpkLine(info: PeriodInfo | undefined) {
  if (!info) return null;
  if (info.jpkStatus === "sent")
    return (
      <span className="inline-flex items-center gap-1 text-ok-soft-ink">
        <Check className="size-3.5" strokeWidth={2.25} /> wysłany
      </span>
    );
  if (info.jpkStatus === "due") return <span className="text-wa-soft-ink">do {dm(info.jpkDeadline)}</span>;
  return <span className="text-ink-3">—</span>;
}

/** Year stepper + 4×3 month grid with the JPK status of each month [B13 B14 A7]. */
function MonthGrid({
  companyId,
  period,
  onPick,
  onConfigureYear,
  jpkUnavailable,
  refreshKey,
}: {
  companyId: string;
  period: Period;
  onPick: (p: Period) => void;
  onConfigureYear: () => void;
  jpkUnavailable?: boolean;
  refreshKey?: unknown;
}) {
  const [year, setYear] = useState(period.year);
  const [months, setMonths] = useState<PeriodInfo[] | null>(null);

  useEffect(() => {
    let alive = true;
    getPeriods(companyId, year).then((m) => alive && setMonths(m));
    return () => {
      alive = false;
      setMonths(null);
    };
  }, [companyId, year, refreshKey]);

  const step = "grid size-10 place-items-center rounded-md text-ink-2 hover:bg-surface-hover hover:text-ink-1 disabled:text-ink-disabled disabled:hover:bg-transparent";
  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-1">
          <button type="button" className={step} disabled={year <= MIN_PERIOD.year} onClick={() => setYear((y) => y - 1)} aria-label="Poprzedni rok">
            <ChevronLeft className="size-4.5" />
          </button>
          <span className="tnum min-w-14 text-center font-display text-display-3">{year}</span>
          <button type="button" className={step} disabled={year >= MAX_PERIOD.year} onClick={() => setYear((y) => y + 1)} aria-label="Następny rok">
            <ChevronRight className="size-4.5" />
          </button>
        </div>
        {year === TY && (
          <p className="text-small text-wa-soft-ink">
            Rok wymaga konfiguracji ·{" "}
            <button type="button" onClick={onConfigureYear} className="rounded-xs font-medium text-ink-1 hover:underline hover:underline-offset-3">
              Skonfiguruj
            </button>
          </p>
        )}
      </div>
      {jpkUnavailable && <p className="text-small text-ink-2">Statusy JPK niedostępne.</p>}
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => {
          const info = months?.[i];
          const selected = year === period.year && i + 1 === period.month;
          const today = year === TY && i + 1 === TM;
          const status = info?.jpkStatus === "sent" ? "JPK wysłany" : info?.jpkStatus === "due" ? `JPK do ${info && dm(info.jpkDeadline)}` : "okres przyszły";
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick({ year, month: i + 1 })}
              aria-pressed={selected}
              aria-label={`${cap(monthNames[i])} ${year}, ${status}${today ? ", bieżący miesiąc" : ""}`}
              className={cn(
                "relative flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-sm px-3 text-left transition-colors duration-(--dur-fast)",
                selected ? "bg-accent-fill text-accent-knockout" : "hover:bg-surface-hover",
              )}
            >
              <span className="text-title">{cap(monthNames[i])}</span>
              <span className={cn("text-small", selected && "*:text-accent-knockout! opacity-90")}>
                {jpkUnavailable ? null : months ? jpkLine(info) : <Skeleton className="h-3 w-12" />}
              </span>
              {today && <span aria-hidden className={cn("absolute top-2.5 right-2.5 size-1.5 rounded-pill", selected ? "bg-accent-knockout" : "bg-accent-fill")} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** ‹ Październik 2026 ▾ › — the period is the headline of the page. */
export function PeriodPicker({
  companyId,
  period,
  onChange,
  onConfigureYear,
  jpkUnavailable,
  refreshKey,
  size = "desktop",
}: {
  companyId: string;
  period: Period;
  onChange: (p: Period) => void;
  onConfigureYear: () => void;
  jpkUnavailable?: boolean;
  refreshKey?: unknown;
  size?: "desktop" | "phone";
}) {
  const [open, setOpen] = useState(false);
  const prev = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);
  const label = formatPeriod(period.year, period.month);
  const step =
    "grid size-11 shrink-0 place-items-center rounded-md text-ink-2 transition-colors duration-(--dur-fast) hover:bg-surface-hover hover:text-ink-1 disabled:text-ink-disabled disabled:hover:bg-transparent";

  const stepper = (dir: -1 | 1) => {
    const target = dir < 0 ? prev : next;
    const name = dir < 0 ? "Poprzedni miesiąc" : "Następny miesiąc";
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className={step} disabled={!target} onClick={() => target && onChange(target)} aria-label={name}>
            {dir < 0 ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div role="group" aria-label="Okres rozliczeniowy" className={cn("flex items-center", size === "phone" ? "-mx-3 gap-0" : "gap-1")}>
      {stepper(-1)}
      <Overlay
        title="Wybierz okres"
        open={open}
        onOpenChange={setOpen}
        align="end"
        className="w-130 p-3"
        trigger={
          <button
            type="button"
            aria-label={`Okres: ${label}. Zmień okres`}
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-md px-2 text-left transition-colors duration-(--dur-fast) hover:bg-surface-hover aria-expanded:bg-surface-pressed",
              size === "phone" ? "h-12 flex-1 font-display text-display-1" : "h-11 font-display text-display-3",
            )}
          >
            <span className="truncate">{label}</span>
            <ChevronDown className="size-4.5 shrink-0 text-ink-2" />
          </button>
        }
      >
        <MonthGrid
          companyId={companyId}
          period={period}
          refreshKey={refreshKey}
          jpkUnavailable={jpkUnavailable}
          onConfigureYear={() => {
            setOpen(false);
            onConfigureYear();
          }}
          onPick={(p) => {
            onChange(p);
            setOpen(false);
          }}
        />
      </Overlay>
      {stepper(1)}
    </div>
  );
}
