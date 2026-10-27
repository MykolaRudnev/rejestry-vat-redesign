"use client";
import { Fragment, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { formatDayHeading, formatMoney } from "@/lib/format";
import { docTypeLabel, ksefLabel } from "@/lib/labels";
import type { RegisterEntry } from "@/lib/types";
import { round2 } from "@/lib/vat";
import { KsefStatusLabel } from "./ksef-status";
import { Money } from "./money";

const LONG_PRESS_MS = 450;

/**
 * Phone register (DS §8 List rows): grouped by day with the day's VAT, the whole row is the target.
 * Long-press enters selection mode; then a tap toggles the row.
 */
export function EntriesList({
  entries,
  onOpen,
  groupByDay,
  visible,
  onMore,
  flashId,
  selected,
  onToggle,
}: {
  entries: RegisterEntry[];
  onOpen: (e: RegisterEntry) => void;
  groupByDay: boolean;
  visible: number;
  onMore: () => void;
  flashId?: string;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const shown = entries.slice(0, visible);
  const left = entries.length - shown.length;
  const selecting = selected.size > 0;
  const timer = useRef<number | undefined>(undefined);
  const longPressed = useRef(false);
  const dayVat = new Map<string, number>();
  for (const e of entries) dayVat.set(e.issueDate, round2((dayVat.get(e.issueDate) ?? 0) + e.vat));

  return (
    <div>
      <ul className="-mx-(--gutter)">
        {shown.map((e, i) => {
          const header = groupByDay && (i === 0 || shown[i - 1].issueDate !== e.issueDate);
          const quietKsef = e.ksef.status === "accepted" || e.ksef.status === "outside";
          const isSelected = selected.has(e.id);
          return (
            <Fragment key={e.id}>
              {header && (
                <li
                  aria-hidden
                  className="sticky top-[calc(3.25rem+var(--toolbar-h,3.75rem))] z-10 flex items-baseline justify-between bg-surface-sheet px-(--gutter) pt-5 pb-1.5 text-small font-medium text-ink-2"
                >
                  <span className="first-letter:uppercase">{formatDayHeading(e.issueDate)}</span>
                  <span className="tnum font-normal text-ink-3">
                    VAT <Money value={dayVat.get(e.issueDate) ?? 0} className="text-ink-3" />
                  </span>
                </li>
              )}
              <li className={cn(!header && "[&>button]:border-t [&>button]:border-line-subtle")}>
                <button
                  type="button"
                  onPointerDown={() => {
                    longPressed.current = false;
                    timer.current = window.setTimeout(() => {
                      longPressed.current = true;
                      navigator.vibrate?.(10);
                      onToggle(e.id);
                    }, LONG_PRESS_MS);
                  }}
                  onPointerUp={() => clearTimeout(timer.current)}
                  onPointerLeave={() => clearTimeout(timer.current)}
                  onContextMenu={(ev) => ev.preventDefault()}
                  onClick={() => {
                    if (longPressed.current) return;
                    if (selecting) onToggle(e.id);
                    else onOpen(e);
                  }}
                  aria-pressed={selecting ? isSelected : undefined}
                  aria-label={`${e.counterparty.name}, ${e.number}, brutto ${formatMoney(e.gross)}, KSeF: ${ksefLabel[e.ksef.status]}`}
                  className={cn(
                    "mx-(--gutter) flex w-[calc(100%-2*var(--gutter))] min-h-16 items-center gap-3 py-3 text-left transition-colors duration-(--dur-fast) select-none active:bg-surface-pressed",
                    isSelected && "bg-surface-selected",
                    e.id === flashId && "row-flash",
                  )}
                >
                  {selecting && (
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-xs text-accent-knockout",
                        isSelected ? "bg-accent-fill" : "inset-ring-2 inset-ring-line-control",
                      )}
                    >
                      {isSelected && <Check className="size-3.5" strokeWidth={2.5} />}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-title">{e.counterparty.name}</span>
                      <Money value={e.gross} className="shrink-0 font-medium" />
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-3">
                      <span className="tnum truncate text-small text-ink-2">
                        {e.number} · {docTypeLabel[e.docType]}
                      </span>
                      {!quietKsef || e.register === "sales" ? (
                        <KsefStatusLabel status={e.ksef.status} className="shrink-0" />
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            </Fragment>
          );
        })}
      </ul>
      {left > 0 && (
        <Button className="mt-4 w-full" onClick={onMore}>
          Pokaż kolejne {Math.min(10, left)} (z {entries.length})
        </Button>
      )}
    </div>
  );
}
