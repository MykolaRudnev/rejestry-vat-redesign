"use client";
import { useState } from "react";
import { AlertOctagon, CircleCheck, CircleDashed, KeyRound, RotateCw, Send, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { formatDateTime } from "@/lib/format";
import { isInFlight, ksefProblem, ksefStatusLine, needsAttention } from "@/lib/ksef";
import { documentsCount, ksefLabel } from "@/lib/labels";
import type { RegisterEntry } from "@/lib/types";
import { KsefStatusLabel } from "./ksef-status";
import { Money } from "./money";

export interface TriageHandlers {
  onFix: (e: RegisterEntry) => void;
  onSend: (e: RegisterEntry) => void;
  onSendAll: (list: RegisterEntry[]) => void;
  onRenew: (e: RegisterEntry) => void;
  onOpenEntry: (e: RegisterEntry) => void;
}

function Problem({ e, h }: { e: RegisterEntry; h: TriageHandlers }) {
  const err = ksefProblem(e);
  const flying = isInFlight(e.ksef.status);
  return (
    <article aria-live="polite" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <KsefStatusLabel status={e.ksef.status} />
          <button type="button" onClick={() => h.onOpenEntry(e)} className="tnum rounded-xs text-body text-ink-1 hover:underline hover:underline-offset-3">
            {e.number}
          </button>
        </div>
        <p className="text-body text-ink-2">
          {e.counterparty.name} · <Money value={e.gross} variant="inline" />
        </p>
      </div>

      {err ? (
        <div className="flex flex-col gap-3">
          <h3 className={`font-display text-display-3 ${err.action === "renew" ? "text-wa-soft-ink" : "text-er-soft-ink"}`}>{err.title}</h3>
          <p className="max-w-[56ch] text-body">{err.why(e)}</p>
          <p className="max-w-[56ch] text-body">
            <span className="font-medium">Co zrobić:</span> {err.what}
          </p>
          <p className="text-small text-ink-3">
            Kod błędu: {e.ksef.error!.code}
            {e.ksef.sentAt && ` · ${formatDateTime(e.ksef.sentAt)}`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-display-3">
            {flying ? "Wysyłamy do KSeF" : e.ksef.status === "accepted" ? "Przyjęta w KSeF" : "Faktura czeka na wysłanie"}
          </h3>
          <p className="max-w-[56ch] text-body text-ink-2">
            {flying ? ksefStatusLine[e.ksef.status] : e.ksef.status === "accepted" ? "Numer KSeF nadany. Możesz przejść do następnej." : `${ksefStatusLine.not_sent} Sprawdź dane i wyślij.`}
          </p>
        </div>
      )}

      {!flying && e.ksef.status !== "accepted" && (
        <div className="flex flex-wrap gap-2">
          {err?.action === "renew" ? (
            <Button variant="primary" onClick={() => h.onRenew(e)}>
              <KeyRound /> Odnów połączenie
            </Button>
          ) : err ? (
            <>
              <Button variant="primary" onClick={() => h.onFix(e)}>
                <Wrench /> Popraw dane
              </Button>
              {/* resending unchanged data fails again, so this stays a quiet text action */}
              <Button variant="text" onClick={() => h.onSend(e)}>
                <RotateCw className="size-4" /> Wyślij ponownie
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => h.onSend(e)}>
                <Send /> Wyślij do KSeF
              </Button>
              <Button onClick={() => h.onOpenEntry(e)}>Sprawdź dane</Button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * "Do wyjaśnienia w KSeF" (REDESIGN-PLAN §2.5): one problem at a time with the reason and what to do.
 * The list is frozen when the sheet opens, so resolved items stay countable ("1 z 3") until all are accepted.
 */
export function KsefTriage({
  open,
  onOpenChange,
  entries,
  handlers,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entries: RegisterEntry[];
  handlers: TriageHandlers;
}) {
  const desktop = useIsDesktop();
  const [ids, setIds] = useState<string[]>([]);
  const [i, setI] = useState(0);
  // freeze the list once per opening, as soon as fresh entries arrive (the tab may still be loading)
  const [frozen, setFrozen] = useState(false);
  if (!open && frozen) setFrozen(false);
  if (open && !frozen && entries.length) {
    setFrozen(true);
    // rejected first, then not sent; keep anything already in flight from a previous pass
    const list = entries.filter((e) => needsAttention(e.ksef.status) || isInFlight(e.ksef.status));
    list.sort((a, b) => Number(b.ksef.status === "rejected") - Number(a.ksef.status === "rejected"));
    setIds(list.map((e) => e.id));
    setI(0);
  }
  const items = ids.map((id) => entries.find((e) => e.id === id)).filter((e): e is RegisterEntry => !!e);
  const open_ = items.filter((e) => e.ksef.status !== "accepted");
  const problems = items.filter((e) => needsAttention(e.ksef.status)).length;
  const done = items.length > 0 && open_.length === 0;
  const idx = Math.min(i, Math.max(0, items.length - 1));
  const current = items[idx];
  const notSent = items.filter((e) => e.ksef.status === "not_sent");

  const title = "Do wyjaśnienia w KSeF";
  const desc = !frozen
    ? "Wczytywanie…"
    : items.length === 0
      ? "Brak faktur do wyjaśnienia."
      : done
        ? "Wszystkie faktury z tej listy są przyjęte."
    : `Dokument ${idx + 1} z ${items.length} · ${problems ? `pozostało\u00a0${problems}` : "trwa wysyłka"}`;

  const body = !frozen ? (
    <div aria-busy className="flex flex-col gap-3">
      <span className="sr-only">Wczytywanie…</span>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  ) : items.length === 0 || done ? (
      <div className="flex flex-col items-start gap-3 py-6">
        <CircleCheck className="size-10 text-ok-soft-ink" strokeWidth={1.5} />
        <h3 className="font-display text-display-3">Wszystko wyjaśnione</h3>
        <p className="max-w-[56ch] text-body text-ink-2">Faktury sprzedaży z tego okresu są w KSeF. Możesz zamknąć okres.</p>
      </div>
    ) : (
      <div className="flex flex-col gap-8 pb-4">
        <Problem key={current.id} e={current} h={handlers} />
        {notSent.length > 1 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-body text-ink-2">
            <CircleDashed className="size-4.5" />
            {documentsCount(notSent.length)} jeszcze nie wysłano.
            <Button variant="text" onClick={() => handlers.onSendAll(notSent)}>
              Wyślij wszystkie
            </Button>
          </div>
        )}
        {items.length > 1 && (
          <ol aria-label="Lista do wyjaśnienia" className="flex flex-wrap gap-1.5">
            {items.map((e, n) => (
              <li key={e.id}>
                <button
                  type="button"
                  aria-current={n === idx ? "step" : undefined}
                  aria-label={`Dokument ${n + 1}: ${e.number}, ${ksefLabel[e.ksef.status].toLowerCase()}`}
                  onClick={() => setI(n)}
                  className={
                    "grid size-8 place-items-center rounded-pill text-small font-medium transition-colors duration-(--dur-fast) " +
                    (n === idx
                      ? "bg-accent-fill text-accent-knockout"
                      : e.ksef.status === "accepted"
                        ? "bg-ok-soft text-ok-soft-ink"
                        : e.ksef.status === "rejected"
                          ? "bg-er-soft text-er-soft-ink"
                          : "bg-surface-sunken text-ink-2")
                  }
                >
                  {e.ksef.status === "accepted" ? <CircleCheck className="size-4" /> : e.ksef.status === "rejected" && n !== idx ? <AlertOctagon className="size-4" /> : n + 1}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    );

  const footer =
    done || items.length === 0 ? (
      <Button variant="primary" className="ml-auto" onClick={() => onOpenChange(false)}>
        Zamknij
      </Button>
    ) : (
      <>
        <Button variant="ghost" disabled={idx === 0} onClick={() => setI(idx - 1)}>
          ‹ Poprzednia
        </Button>
        <Button variant="ghost" className="ml-auto" disabled={idx >= items.length - 1} onClick={() => setI(idx + 1)}>
          Następna ›
        </Button>
      </>
    );

  if (!desktop)
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{desc}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>{body}</DrawerBody>
          <DrawerFooter className="flex-row border-t border-line-subtle">{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{desc}</SheetDescription>
        </SheetHeader>
        <SheetBody className="pt-4">{body}</SheetBody>
        <SheetFooter className="justify-start">{footer}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
