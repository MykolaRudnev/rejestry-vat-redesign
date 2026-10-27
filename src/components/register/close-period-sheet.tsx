"use client";
import { useEffect, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, CloudOff, FileCode2, Lock, Printer, TriangleAlert, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { getJpkPreview, type JpkField, type JpkPreview } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { documentsCount, monthLocative, monthNames, plural } from "@/lib/labels";
import type { Company, DemoState, PeriodInfo } from "@/lib/types";
import { round2 } from "@/lib/vat";
import { Money } from "./money";

type Step = "check" | "confirm" | "jpk";
const steps: { id: Step; label: string }[] = [
  { id: "check", label: "Sprawdź" },
  { id: "confirm", label: "Potwierdź" },
  { id: "jpk", label: "JPK" },
];

function Steps({ current }: { current: Step }) {
  const at = steps.findIndex((s) => s.id === current);
  return (
    <ol aria-label="Kroki" className="flex items-center gap-4 text-small">
      {steps.map((s, i) => (
        <li key={s.id} aria-current={i === at ? "step" : undefined} className={cn("flex items-center gap-1.5", i === at ? "font-medium text-ink-1" : i < at ? "text-ok-soft-ink" : "text-ink-3")}>
          <span aria-hidden className={cn("size-2 rounded-pill", i === at ? "bg-accent-fill" : i < at ? "bg-ok-fill" : "bg-line-subtle")} />
          {s.label}
        </li>
      ))}
    </ol>
  );
}

function Check({ tone, children, action }: { tone: "ok" | "er" | "wa"; children: ReactNode; action?: ReactNode }) {
  const Icon = tone === "ok" ? CircleCheck : tone === "er" ? CircleAlert : TriangleAlert;
  return (
    <li className="flex min-h-11 items-start gap-3 py-1.5">
      <Icon className={cn("mt-0.5 size-4.5 shrink-0", tone === "ok" ? "text-ok-soft-ink" : tone === "er" ? "text-er-soft-ink" : "text-wa-soft-ink")} />
      <span className="flex-1 text-body">{children}</span>
      {action}
    </li>
  );
}

function FieldRows({ title, rows }: { title: string; rows: JpkField[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-title">{title}</h3>
      <dl className="flex flex-col">
        {rows.map((f) => (
          <div key={f.code} className="flex items-baseline gap-3 border-b border-line-subtle py-2 last:border-b-0">
            <dt className="w-12 shrink-0 font-mono text-mono text-ink-3">{f.code}</dt>
            <dd className="flex-1 text-body text-ink-2">{f.label}</dd>
            <dd className="text-right">
              <Money value={f.value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * "Zamknij okres" (REDESIGN-PLAN §2.7): Sprawdź → Potwierdź → JPK in one sheet.
 * Rejected KSeF invoices block closing; not-sent / queued ones only warn.
 * Opened on a confirmed period (or via "Podgląd JPK") it starts at the JPK step.
 */
export function ClosePeriodSheet({
  open,
  onOpenChange,
  start,
  company,
  info,
  counts,
  vatDue,
  issues,
  inFlight,
  demoState,
  onExplain,
  onConfirm,
  onReopen,
  onExport,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  start: Step;
  company: Company;
  info: PeriodInfo;
  counts: { sales: number; purchase: number };
  vatDue: { output: number; input: number };
  issues: { rejected: number; notSent: number };
  inFlight: number;
  demoState: DemoState;
  onExplain: () => void;
  onConfirm: () => Promise<void>;
  onReopen: () => Promise<void>;
  onExport: (fields: JpkField[]) => void;
}) {
  const desktop = useIsDesktop();
  const [step, setStep] = useState<Step>(start);
  const [busy, setBusy] = useState(false);
  const [reopenAsk, setReopenAsk] = useState(false);
  const [jpk, setJpk] = useState<JpkPreview | null>(null);
  const [jpkError, setJpkError] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep(start);
      setReopenAsk(false);
    }
  }

  const needJpk = open && step === "jpk";
  useEffect(() => {
    if (!needJpk) return;
    let alive = true;
    getJpkPreview(company.id, info.year, info.month, demoState)
      .then((j) => {
        if (!alive) return;
        setJpk(j);
        setJpkError(false);
      })
      .catch(() => alive && setJpkError(true));
    return () => {
      alive = false;
      setJpk(null);
    };
  }, [needJpk, company.id, info.year, info.month, demoState, nonce, info.confirmed]);

  const month = monthNames[info.month - 1];
  const total = counts.sales + counts.purchase;
  const due = round2(vatDue.output - vatDue.input);
  const deadline = formatDate(info.jpkDeadline);
  const blocked = issues.rejected > 0;
  const waiting = issues.notSent + inFlight;

  const monthTitle = `${month[0].toUpperCase()}${month.slice(1)} ${info.year}`;
  const title = step === "jpk" ? `JPK_${company.vatScheme}` : "Zamknij okres";
  const description =
    step === "jpk"
      ? info.jpkSentAt
        ? `${monthTitle} · wysłany ${formatDate(info.jpkSentAt)} · UPO`
        : info.confirmed
          ? `${monthTitle} · okres potwierdzony · do wysłania do ${deadline}`
          : `${monthTitle} · wersja robocza, okres nie jest potwierdzony`
      : `${monthTitle} · JPK_${company.vatScheme} do ${deadline}`;

  let body: ReactNode;
  let footer: ReactNode;
  if (step === "check") {
    body = (
      <div className="flex flex-col gap-8">
        <Steps current="check" />
        <ul className="flex flex-col">
          {total ? (
            <Check tone="ok">Wszystkie dokumenty w okresie ({total})</Check>
          ) : (
            <Check tone="ok">Brak dokumentów. Możesz potwierdzić pusty okres.</Check>
          )}
          {blocked ? (
            <Check
              tone="er"
              action={
                <Button variant="text" onClick={onExplain}>
                  Wyjaśnij
                </Button>
              }
            >
              {issues.rejected} {plural(issues.rejected, "faktura odrzucona", "faktury odrzucone", "faktur odrzuconych")} w KSeF
            </Check>
          ) : (
            <Check tone="ok">Brak faktur odrzuconych w KSeF</Check>
          )}
          {waiting > 0 && (
            <Check
              tone="wa"
              action={
                <Button variant="text" onClick={onExplain}>
                  Pokaż
                </Button>
              }
            >
              {waiting} {plural(waiting, "faktura czeka", "faktury czekają", "faktur czeka")} na KSeF (niewysłane lub w kolejce)
            </Check>
          )}
          <Check tone="ok">Brak dokumentów spoza okresu</Check>
        </ul>
        <div className="flex flex-col gap-1.5">
          <p className="tnum text-body text-ink-2">
            VAT należny <Money value={vatDue.output} /> · naliczony <Money value={vatDue.input} />
          </p>
          <p className="text-body text-ink-2">
            {due >= 0 ? "VAT do zapłaty" : "Nadwyżka do przeniesienia"}{" "}
            <Money value={Math.abs(due)} variant="display" className="font-display text-display-3" />
          </p>
        </div>
      </div>
    );
    footer = (
      <>
        {blocked && <p className="mr-auto text-small text-er-soft-ink max-sm:hidden">Najpierw wyjaśnij odrzucone faktury.</p>}
        <Button onClick={() => onOpenChange(false)}>Anuluj</Button>
        <Button variant="primary" disabled={blocked} onClick={() => setStep("confirm")}>
          Dalej
        </Button>
      </>
    );
  } else if (step === "confirm") {
    body = (
      <div className="flex flex-col gap-8">
        <Steps current="confirm" />
        <div className="flex flex-col gap-3">
          <Lock className="size-8 text-ink-3" strokeWidth={1.5} />
          <p className="font-display text-display-3">Potwierdzić {month}?</p>
          <p className="max-w-[56ch] text-body text-ink-2">
            Po potwierdzeniu dokumenty za {monthLocative[info.month - 1]} będą tylko do odczytu, a JPK_{company.vatScheme} będzie gotowy do wysłania do {deadline}.
          </p>
          {waiting > 0 && (
            <p className="flex items-start gap-2 text-small text-wa-soft-ink">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              {documentsCount(waiting)} wciąż czeka na KSeF. Wyślesz je także po potwierdzeniu.
            </p>
          )}
        </div>
      </div>
    );
    footer = (
      <>
        <Button onClick={() => setStep("check")}>Wróć</Button>
        <Button
          variant="primary"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            await onConfirm();
            setBusy(false);
            setStep("jpk");
          }}
        >
          {busy ? "Potwierdzanie…" : "Potwierdź okres"}
        </Button>
      </>
    );
  } else {
    body = (
      <div className="flex flex-col gap-8">
        {info.confirmed && !info.jpkSentAt && <Steps current="jpk" />}
        {jpkError ? (
          <div className="flex flex-col items-start gap-3">
            <CloudOff className="size-10 text-ink-3" strokeWidth={1.5} />
            <p className="font-display text-display-3">Nie udało się przygotować JPK</p>
            <p className="max-w-[56ch] text-body text-ink-2">Dane okresu są bezpieczne. Spróbuj ponownie za chwilę.</p>
            <Button variant="primary" onClick={() => setNonce((n) => n + 1)}>
              Spróbuj ponownie
            </Button>
          </div>
        ) : !jpk ? (
          <div aria-busy className="flex flex-col gap-3">
            <span className="sr-only">Przygotowujemy JPK…</span>
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : jpk.counts.sales + jpk.counts.purchase === 0 ? (
          <p className="text-body text-ink-2">Brak danych za okres — deklaracja będzie zerowa.</p>
        ) : (
          <>
            {(() => {
              const key = jpk.totals[jpk.totals.length - 1];
              return (
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-body text-ink-2">{key.label}</span>
                  <Money value={key.value} variant="display" className="font-display text-display-3" />
                  <span className="font-mono text-mono text-ink-3">{key.code}</span>
                </p>
              );
            })()}
            <FieldRows title="Sprzedaż" rows={jpk.sales} />
            <FieldRows title="Zakupy" rows={jpk.purchases} />
            <FieldRows title="Rozliczenie" rows={jpk.totals} />
          </>
        )}
        {info.confirmed && !info.jpkSentAt && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-2">
            {reopenAsk ? (
              <>
                Dokumenty znów będzie można edytować.
                <Button
                  variant="text"
                  className="text-small text-er-soft-ink"
                  onClick={async () => {
                    setBusy(true);
                    await onReopen();
                    setBusy(false);
                    onOpenChange(false);
                  }}
                >
                  Otwórz okres
                </Button>
                <Button variant="text" className="text-small text-ink-2" onClick={() => setReopenAsk(false)}>
                  Anuluj
                </Button>
              </>
            ) : (
              <Button variant="text" className="text-small" onClick={() => setReopenAsk(true)}>
                <Unlock className="size-4" /> Otwórz okres ponownie
              </Button>
            )}
          </div>
        )}
      </div>
    );
    footer = (
      <>
        {!info.confirmed && info.jpkStatus === "due" && (
          <Button variant="text" className="mr-auto" onClick={() => setStep("check")}>
            Zamknij okres
          </Button>
        )}
        <Button onClick={() => window.print()}>
          <Printer /> Drukuj
        </Button>
        <Button variant="primary" disabled={!jpk} onClick={() => jpk && onExport([...jpk.sales, ...jpk.purchases, ...jpk.totals])}>
          <FileCode2 /> {info.confirmed ? "Eksportuj JPK (XML)" : "Eksportuj wersję roboczą (XML)"}
        </Button>
      </>
    );
  }

  if (!desktop)
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>{body}</DrawerBody>
          <DrawerFooter className="flex-row flex-wrap justify-end">{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <SheetBody className="pt-4">{body}</SheetBody>
        <SheetFooter className="flex-wrap border-t border-line-subtle">{footer}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
