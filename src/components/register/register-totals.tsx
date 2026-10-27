"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { vatRateLabel, vatRates } from "@/lib/labels";
import type { VatRate } from "@/lib/types";
import { Money } from "./money";

const viz: Record<VatRate, string> = {
  "23": "bg-viz-23",
  "8": "bg-viz-8",
  "5": "bg-viz-5",
  "0": "bg-viz-0",
  zw: "bg-viz-zw",
  np: "bg-viz-np",
};

type Totals = { net: number; vat: number; gross: number; byRate: Record<VatRate, { net: number; vat: number }> };

/** Register totals [B19] as one quiet line + "Kwoty według stawek VAT" as one segmented bar [B20]. */
export function RegisterTotals({ totals, filtered, loading }: { totals?: Totals; filtered: boolean; loading?: boolean }) {
  const [ratesOpen, setRatesOpen] = useState(false);
  if (loading || !totals)
    return (
      <div aria-hidden className="flex flex-col gap-3">
        <Skeleton className="h-4 w-80 max-w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  const base = vatRates.reduce((a, r) => a + Math.abs(totals.byRate[r].net), 0);

  return (
    <section aria-label="Podsumowanie rejestru" className="flex flex-col gap-3">
      <p className="tnum flex flex-wrap items-baseline gap-x-2 gap-y-1 text-body text-ink-2">
        <span>
          Netto <Money value={totals.net} />
        </span>
        <span aria-hidden>·</span>
        <span>
          VAT <Money value={totals.vat} />
        </span>
        <span aria-hidden className="max-sm:hidden">·</span>
        <span className="max-sm:basis-full">
          Brutto <Money value={totals.gross} /> <span className="text-ink-3">zł</span>
        </span>
        {filtered && <span className="text-small text-accent-text">· wg filtrów</span>}
      </p>

      {base > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div
              role="img"
              aria-label={`Kwoty według stawek VAT: ${vatRates
                .filter((r) => totals.byRate[r].net)
                .map((r) => `${vatRateLabel[r]} ${formatMoney(totals.byRate[r].net)}`)
                .join(", ")}`}
              className="flex h-2 w-full flex-1 gap-0.5 overflow-hidden rounded-xs bg-surface-sunken"
            >
              {vatRates.map((r) =>
                totals.byRate[r].net ? (
                  <div key={r} className={cn("h-full first:rounded-l-xs last:rounded-r-xs", viz[r])} style={{ width: `${(Math.abs(totals.byRate[r].net) / base) * 100}%` }} />
                ) : null,
              )}
            </div>
            <button
              type="button"
              onClick={() => setRatesOpen((o) => !o)}
              aria-expanded={ratesOpen}
              aria-controls="rates-legend"
              className="-ml-1 flex h-11 shrink-0 items-center gap-1 rounded-sm px-1 text-small text-ink-2 sm:hidden"
            >
              Stawki <ChevronDown className={cn("size-4 transition-transform duration-(--dur-base)", ratesOpen && "rotate-180")} />
            </button>
          </div>
          <ul id="rates-legend" aria-label="Kwoty według stawek VAT" className={cn("flex flex-wrap gap-x-6 gap-y-2 text-small", !ratesOpen && "max-sm:hidden")}>
            {vatRates.map((r) => {
              const zero = !totals.byRate[r].net;
              return (
                <li key={r}>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5 rounded-xs text-left">
                      <span aria-hidden className={cn("size-2 rounded-pill", viz[r])} />
                      <span className={cn("font-medium", zero ? "text-ink-3" : "text-ink-1")}>{vatRateLabel[r]}</span>
                      {zero ? <span className="text-ink-3">—</span> : <Money value={totals.byRate[r].net} className="text-ink-2" />}
                    </TooltipTrigger>
                    <TooltipContent className="tnum">
                      Netto {formatMoney(totals.byRate[r].net)} · VAT {formatMoney(totals.byRate[r].vat)}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
