"use client";
import { forwardRef } from "react";
import { AlertOctagon, CircleDashed, Lock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TODAY } from "@/data/companies";
import { daysBetween, formatDate } from "@/lib/format";
import { documentsCount, plural } from "@/lib/labels";
import type { PeriodInfo } from "@/lib/types";
import { round2 } from "@/lib/vat";
import { Money } from "./money";

const GEN = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
const dayMonth = (iso: string) => `${Number(iso.slice(8))} ${GEN[Number(iso.slice(5, 7)) - 1]}`;

/**
 * One quiet line instead of the "Wymaga potwierdzenia" badge and the yellow banner [B4 B7].
 * Only the problem state carries colour; the action is a text button.
 */
export function PeriodStatus({ info, scheme, onClosePeriod }: { info: PeriodInfo; scheme: string; onClosePeriod: () => void }) {
  if (info.jpkStatus === "future")
    return (
      <p className="flex items-center gap-2 text-body text-ink-2">
        <CircleDashed className="size-4.5 shrink-0" /> Okres jeszcze się nie rozpoczął
      </p>
    );

  if (info.confirmed)
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-ink-2">
        <Lock className="size-4.5 shrink-0 text-ok-soft-ink" />
        <span className="text-ok-soft-ink">Potwierdzony{info.confirmedAt ? ` ${formatDate(info.confirmedAt).slice(0, 5)}` : ""}</span>
        <span aria-hidden>·</span>
        <span>{info.jpkSentAt ? `JPK_${scheme} wysłany ${formatDate(info.jpkSentAt)}` : `JPK_${scheme} gotowy do wysyłki`}</span>
        <Button variant="text" onClick={onClosePeriod} className="ml-1">
          Podgląd JPK
        </Button>
      </p>
    );

  const days = daysBetween(TODAY, info.jpkDeadline);
  const soon = days <= 5;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-ink-2">
      <TriangleAlert className="size-4.5 shrink-0 text-wa-soft-ink" />
      <span className="text-wa-soft-ink">Wymaga potwierdzenia</span>
      <span aria-hidden>·</span>
      <span className={soon ? "text-wa-soft-ink" : undefined}>
        <span className="md:hidden">JPK do {formatDate(info.jpkDeadline).slice(0, 5)}</span>
        <span className="max-md:hidden">
          JPK_{scheme} do {dayMonth(info.jpkDeadline)}{" "}
          <span className="tnum">({days > 0 ? `za ${days} ${plural(days, "dzień", "dni", "dni")}` : "dziś"})</span>
        </span>
      </span>
      <Button variant="text" onClick={onClosePeriod} className="ml-1">
        Zamknij okres
      </Button>
    </p>
  );
}

/** "VAT do zapłaty" for the whole period — the hero of the page. */
export const VatHero = forwardRef<
  HTMLDivElement,
  { vatDue?: { output: number; input: number }; state: "ready" | "loading" | "error"; periodKey: string }
>(function VatHero({ vatDue, state, periodKey }, ref) {
  if (state === "loading")
    return (
      <div ref={ref} aria-busy className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-52 md:h-16 md:w-72" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  const due = vatDue ? round2(vatDue.output - vatDue.input) : null;
  const surplus = due !== null && due < 0;
  return (
    <div ref={ref} className="flex flex-col gap-2">
      <p className="text-body text-ink-2">{surplus ? "Nadwyżka VAT do przeniesienia" : "VAT do zapłaty"}</p>
      <p key={periodKey} className="rise-in font-display text-hero" aria-live="polite">
        {state === "error" || due === null ? <span className="text-ink-3">—</span> : <Money value={Math.abs(due)} variant="hero" />}
      </p>
      {state !== "error" && vatDue && (
        <p className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-body text-ink-2 md:gap-x-10">
          <span>
            należny <Money value={vatDue.output} variant="display" className="font-display text-display-3" />
          </span>
          <span>
            naliczony <Money value={vatDue.input} variant="display" className="font-display text-display-3" />
          </span>
        </p>
      )}
    </div>
  );
});

/** Shown only when something needs the user; disappears when resolved. No dismiss. */
export function AttentionLine({ rejected, notSent, onOpen }: { rejected: number; notSent: number; onOpen: () => void }) {
  const total = rejected + notSent;
  if (!total) return null;
  const tone = rejected ? "bg-er-soft text-er-soft-ink" : "bg-wa-soft text-wa-soft-ink";
  const Icon = rejected ? AlertOctagon : TriangleAlert;
  const reason = [
    rejected && `${rejected} ${plural(rejected, "odrzucony", "odrzucone", "odrzuconych")}`,
    notSent && `${notSent} ${plural(notSent, "niewysłany", "niewysłane", "niewysłanych")}`,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex min-h-12 w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-body ${tone}`}
    >
      <Icon className="size-4.5 shrink-0" />
      <span className="min-w-0 flex-1">
        <strong className="font-semibold">
          <span className="max-md:hidden">{documentsCount(total)} do wyjaśnienia w KSeF</span>
          <span className="md:hidden">{total} do wyjaśnienia w KSeF</span>
        </strong>
        <span className="max-md:hidden xl:block">
          <span className="xl:hidden"> · </span>
          {reason}
        </span>
      </span>
      <span className="shrink-0 font-medium text-ink-1 group-hover:underline group-hover:underline-offset-3">Wyjaśnij</span>
    </button>
  );
}

