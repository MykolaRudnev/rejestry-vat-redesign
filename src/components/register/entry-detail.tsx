"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertOctagon,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileCode2,
  KeyRound,
  Lock,
  MoreHorizontal,
  Pencil,
  Printer,
  RotateCw,
  Send,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/action-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { getUpo, type Upo } from "@/lib/api";
import { formatDate, formatDateTime, formatNip } from "@/lib/format";
import { isInFlight, ksefProblem, ksefStatusLine } from "@/lib/ksef";
import { docTypeLabel, registerLongLabel, vatRateLabel } from "@/lib/labels";
import type { RegisterEntry } from "@/lib/types";
import { canSendKsef, editBlock, type EntryHandlers } from "./entry-actions";
import { KsefStatusLabel } from "./ksef-status";
import { Money } from "./money";

export interface DetailHandlers extends EntryHandlers {
  /** "Popraw dane": opens the form focused on the field the rejection points at. */
  onFix: (e: RegisterEntry) => void;
  /** "Odnów połączenie" for SESJA_WYGASLA. */
  onRenewSession: (e: RegisterEntry) => void;
  companyId: string;
}

function CopyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Kopiuj: ${label}`}
      className="-my-1 inline-grid size-7 shrink-0 place-items-center rounded-sm text-ink-3 transition-colors duration-(--dur-fast) hover:bg-surface-hover hover:text-ink-1"
    >
      <Copy className="size-3.5" />
    </button>
  );
}

function Facts({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-[minmax(7.5rem,auto)_1fr] gap-x-6 gap-y-3 text-body">{children}</dl>;
}
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-ink-2">{label}</dt>
      <dd className="min-w-0 text-ink-1">{children}</dd>
    </>
  );
}

function KsefSection({ e, h, sending }: { e: RegisterEntry; h: DetailHandlers; sending: boolean }) {
  const err = ksefProblem(e);
  return (
    <section aria-labelledby="ksef-h" className="flex flex-col gap-3">
      <h3 id="ksef-h" className="text-title">
        KSeF
      </h3>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {sending ? <KsefStatusLabel status="processing" /> : <KsefStatusLabel status={e.ksef.status} />}
        {e.ksef.status === "accepted" && e.ksef.acceptedAt && <span className="text-small text-ink-2">{formatDateTime(e.ksef.acceptedAt)}</span>}
      </div>
      {!err && e.ksef.status !== "accepted" && <p className="text-body text-ink-2">{sending ? ksefStatusLine.processing : ksefStatusLine[e.ksef.status]}</p>}
      {e.ksef.number && (
        <p className="flex items-start gap-1">
          <span className="font-mono text-mono break-all text-ink-1">{e.ksef.number}</span>
          <CopyButton label="Numer KSeF" onClick={() => h.onCopy(e.ksef.number!, "Numer KSeF")} />
        </p>
      )}
      {e.ksef.status === "accepted" && e.register === "sales" && (
        <p className="text-small text-ink-3">Faktura przyjęta w KSeF. Zmiana wymaga korekty.</p>
      )}
      {err && (
        <div role="alert" className={cn("flex gap-3 rounded-lg px-4 py-3.5", err.action === "renew" ? "bg-wa-soft text-wa-soft-ink" : "bg-er-soft text-er-soft-ink")}>
          <AlertOctagon className="mt-1 size-4.5 shrink-0" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="font-display text-display-3">{err.title}</p>
            <p className="text-body text-ink-1">{err.why(e)}</p>
            <p className="text-body text-ink-1">
              <span className="font-medium">Co zrobić:</span> {err.what}
            </p>
            <p className="text-small text-ink-2">
              Kod błędu: {e.ksef.error!.code}
              {e.ksef.sentAt && ` · ${formatDateTime(e.ksef.sentAt)}`}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function UpoView({ e, companyId, onCopy }: { e: RegisterEntry; companyId: string; onCopy: EntryHandlers["onCopy"] }) {
  const [upo, setUpo] = useState<Upo | null>(null);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let alive = true;
    getUpo(companyId, e.id)
      .then((u) => alive && setUpo(u))
      .catch((err: Error) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [companyId, e.id]);
  if (error) return <p className="max-w-[56ch] text-body text-ink-2">{error}</p>;
  if (!upo)
    return (
      <div aria-busy className="flex flex-col gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display text-display-3">Urzędowe Poświadczenie Odbioru</h3>
      <Facts>
        <Fact label="Numer KSeF">
          <span className="flex items-start gap-1">
            <span className="font-mono text-mono break-all">{upo.ksefNumber}</span>
            <CopyButton label="Numer KSeF" onClick={() => onCopy(upo.ksefNumber, "Numer KSeF")} />
          </span>
        </Fact>
        <Fact label="Data przyjęcia">
          <span className="tnum">{formatDateTime(upo.acceptedAt, true)}</span>
        </Fact>
        <Fact label="NIP sprzedawcy">
          <span className="tnum">{formatNip(upo.sellerNip)}</span>
        </Fact>
        <Fact label="Numer faktury">
          <span className="tnum">{upo.invoiceNumber}</span>
        </Fact>
        <Fact label="Skrót dokumentu">
          <span className="flex items-start gap-1">
            <span className="font-mono text-mono break-all">SHA-256 {upo.hash}</span>
            <CopyButton label="Skrót dokumentu" onClick={() => onCopy(upo.hash, "Skrót dokumentu")} />
          </span>
        </Fact>
        <Fact label="Nr ref. sesji">
          <span className="font-mono text-mono break-all">{upo.sessionRef}</span>
        </Fact>
      </Facts>
    </div>
  );
}

function Body({ e, h, sending }: { e: RegisterEntry; h: DetailHandlers; sending: boolean }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <p className="text-body text-ink-2">Brutto</p>
        <p className="font-display text-display-2">
          <Money value={e.gross} variant="display" />
        </p>
        <p className="tnum text-body text-ink-2">
          Netto <Money value={e.net} /> · VAT {vatRateLabel[e.vatRate]} <Money value={e.vat} />
        </p>
      </div>

      {e.register === "sales" || e.ksef.number ? <KsefSection e={e} h={h} sending={sending} /> : null}

      <section aria-labelledby="doc-h" className="flex flex-col gap-4">
        <h3 id="doc-h" className="text-title">
          Dane dokumentu
        </h3>
        <Facts>
          <Fact label="Data wystawienia">
            <span className="tnum">{formatDate(e.issueDate)}</span>
          </Fact>
          <Fact label="Data sprzedaży">
            <span className="tnum">{formatDate(e.saleDate)}</span>
          </Fact>
          <Fact label="Rodzaj operacji">{docTypeLabel[e.docType]}</Fact>
          <Fact label="Seria">{e.series}</Fact>
          <Fact label="Identyfikator">
            <span className="flex items-start gap-1">
              <span className="tnum">{e.identifier}</span>
              <CopyButton label="Identyfikator" onClick={() => h.onCopy(e.identifier, "Identyfikator")} />
            </span>
          </Fact>
          <Fact label="Kod JPK V7">{e.jpkCodes.length ? e.jpkCodes.map((c) => c.replace("_", " ")).join(" · ") : <span className="text-ink-3">—</span>}</Fact>
          <Fact label="Rejestr">{registerLongLabel[e.register]}</Fact>
          <Fact label="Opis">{e.description}</Fact>
        </Facts>
      </section>
    </div>
  );
}

/** Footer: the primary action follows the KSeF state (REDESIGN-PLAN §2.3 table). */
function Actions({ e, h, sending, onUpo }: { e: RegisterEntry; h: DetailHandlers; sending: boolean; onUpo: () => void }) {
  const blocked = editBlock(e, h.locked);
  const err = ksefProblem(e);
  const more = (
    <ActionMenu
      title={e.number}
      align="start"
      className="w-64"
      trigger={
        <Button variant="ghost" size="icon" aria-label="Więcej akcji dla dokumentu">
          <MoreHorizontal />
        </Button>
      }
      groups={[
        {
          items: [
            { id: "print", label: "Drukuj dokument", icon: Printer, onSelect: () => h.onPrint(e) },
            { id: "copy", label: "Kopiuj numer dokumentu", icon: Copy, onSelect: () => h.onCopy(e.number, "Numer dokumentu") },
          ],
        },
        { items: [{ id: "delete", label: "Usuń z rejestru", icon: Trash2, destructive: true, disabled: !!blocked, hint: blocked, onSelect: () => h.onDelete(e) }] },
      ]}
    />
  );

  let buttons: ReactNode = null;
  if (h.locked) {
    buttons = (
      <Button variant="primary" onClick={() => h.onPrint(e)}>
        <Printer /> Drukuj dokument
      </Button>
    );
  } else if (sending || isInFlight(e.ksef.status)) {
    buttons = null;
  } else if (err) {
    buttons = (
      <>
        <Button onClick={() => h.onSendKsef(e)}>
          <RotateCw /> Wyślij ponownie
        </Button>
        {err.action === "renew" ? (
          <Button variant="primary" onClick={() => h.onRenewSession(e)}>
            <KeyRound /> Odnów połączenie
          </Button>
        ) : (
          <Button variant="primary" onClick={() => h.onFix(e)}>
            <Wrench /> Popraw dane
          </Button>
        )}
      </>
    );
  } else if (canSendKsef(e)) {
    buttons = (
      <>
        <Button onClick={() => h.onEdit(e)}>
          <Pencil /> Edytuj
        </Button>
        <Button variant="primary" onClick={() => h.onSendKsef(e)}>
          <Send /> Wyślij do KSeF
        </Button>
      </>
    );
  } else if (e.ksef.status === "accepted" && e.register === "sales") {
    buttons = (
      <>
        <Button disabled title={blocked}>
          <Pencil /> Edytuj
        </Button>
        <Button variant="primary" onClick={onUpo}>
          <FileCode2 /> Pokaż UPO
        </Button>
      </>
    );
  } else {
    buttons = (
      <Button variant="primary" onClick={() => h.onEdit(e)}>
        <Pencil /> Edytuj
      </Button>
    );
  }
  return (
    <>
      {more}
      <div className="ml-auto flex min-w-0 items-center gap-2 max-md:flex-1 max-md:*:min-w-0 max-md:*:flex-1 max-md:[&_svg]:hidden">{buttons}</div>
    </>
  );
}

/**
 * Document detail [B21–B25 B28]. ≥768: non-modal right panel — the table stays usable and clicking another
 * row swaps the content; ‹ › and ↑/↓ step through rows. <768: 92dvh drawer.
 */
export function EntryDetail({
  entry,
  open,
  onOpenChange,
  handlers,
  sending,
  siblings,
  onNavigate,
}: {
  entry: RegisterEntry | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  handlers: DetailHandlers;
  sending: boolean;
  siblings: RegisterEntry[];
  onNavigate: (e: RegisterEntry) => void;
}) {
  const desktop = useIsDesktop();
  // hairline above the footer only while content runs under it (DS §6, allowed line #3)
  const [under, setUnder] = useState(false);
  const measure = (el: HTMLElement | null) => el && setUnder(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  const [view, setView] = useState<{ id?: string; upo: boolean }>({ upo: false });
  const upo = view.upo && view.id === entry?.id;
  const showUpo = () => setView({ id: entry?.id, upo: true });
  const idx = entry ? siblings.findIndex((s) => s.id === entry.id) : -1;
  const prev = idx > 0 ? siblings[idx - 1] : undefined;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : undefined;

  useEffect(() => {
    if (!open || !desktop) return;
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(t.tagName) || t.closest("tr")) return;
      if (ev.key === "ArrowDown" && next) onNavigate(next);
      if (ev.key === "ArrowUp" && prev) onNavigate(prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, desktop, next, prev, onNavigate]);

  if (!entry) return null;
  const e = entry;
  const meta = upo ? (
    <button type="button" onClick={() => setView({ upo: false })} className="-ml-1 inline-flex items-center gap-1 rounded-xs text-small text-accent-text hover:underline hover:underline-offset-3">
      <ArrowLeft className="size-4" /> UPO · {e.number}
    </button>
  ) : (
    <p className="tnum text-small text-ink-2">
      {docTypeLabel[e.docType]} · {e.number}
    </p>
  );
  const title = e.counterparty.name;
  const sub = (
    <span className="tnum flex flex-wrap items-center gap-x-1 text-small text-ink-2">
      NIP {formatNip(e.counterparty.nip)}
      <CopyButton label="NIP" onClick={() => handlers.onCopy(e.counterparty.nip, "NIP")} />
      {e.counterparty.city && <>· {e.counterparty.city}</>}
    </span>
  );
  const lockedNote = handlers.locked && (
    <p className="flex items-center gap-2 text-small text-ink-2">
      <Lock className="size-4 text-ok-soft-ink" /> Okres potwierdzony — dokument tylko do odczytu.
    </p>
  );
  const content = upo ? (
    <UpoView e={e} companyId={handlers.companyId} onCopy={handlers.onCopy} />
  ) : (
    <div className="flex flex-col gap-6">
      {lockedNote}
      <Body e={e} h={handlers} sending={sending} />
    </div>
  );
  const footer = upo ? (
    <>
      <Button onClick={() => window.print()}>
        <Printer /> Drukuj
      </Button>
      <Button variant="primary" className="ml-auto" onClick={() => handlers.onCopy(e.ksef.number ?? "", "Numer KSeF")}>
        <FileCode2 /> Pobierz UPO (XML)
      </Button>
    </>
  ) : (
    <Actions e={e} h={handlers} sending={sending} onUpo={showUpo} />
  );

  if (desktop)
    return (
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent scrim={false} showCloseButton={false} onInteractOutside={(ev) => ev.preventDefault()} onOpenAutoFocus={(ev) => ev.preventDefault()}>
          <SheetHeader className="pr-6">
            <div className="flex items-center justify-between gap-2">
              {meta}
              <div className="-mr-2 flex items-center">
                <Button variant="ghost" size="icon" aria-label="Poprzedni dokument" disabled={!prev} onClick={() => prev && onNavigate(prev)}>
                  <ChevronLeft />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Następny dokument" disabled={!next} onClick={() => next && onNavigate(next)}>
                  <ChevronRight />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Zamknij" onClick={() => onOpenChange(false)}>
                  <X />
                </Button>
              </div>
            </div>
            <SheetTitle className="pt-1">{title}</SheetTitle>
            <SheetDescription asChild>{sub}</SheetDescription>
          </SheetHeader>
          <SheetBody
            key={`${e.id}-${upo}`}
            ref={(el) => {
              if (!el) return;
              measure(el);
              const ro = new ResizeObserver(() => measure(el));
              ro.observe(el.firstElementChild ?? el);
              return () => ro.disconnect();
            }}
            onScroll={(ev) => measure(ev.currentTarget)}
            className="rise-in pt-4"
          >
            {content}
          </SheetBody>
          <SheetFooter className={cn("justify-start border-t", under ? "border-line-subtle" : "border-transparent")}>{footer}</SheetFooter>
        </SheetContent>
      </Sheet>
    );
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[92dvh]">
        <DrawerHeader>
          {meta}
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription asChild>{sub}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="pt-3">{content}</DrawerBody>
        <DrawerFooter className="flex-row items-center pb-[calc(env(safe-area-inset-bottom)+1rem)]">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
