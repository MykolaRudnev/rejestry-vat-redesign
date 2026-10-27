"use client";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertOctagon, Check, CircleCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ApiError } from "@/lib/api";
import { formatAmount, formatNip, formatPeriod, parseAmount } from "@/lib/format";
import type { FixField } from "@/lib/ksef";
import { docTypeLabel, docTypes, jpkCodeOptions, registerLabel, seriesOf, vatRateLabel, vatRates } from "@/lib/labels";
import { isValidNip, normalizeNip } from "@/lib/nip";
import type { DocType, EntryDraft, Period, RegisterEntry, RegisterKind, VatRate } from "@/lib/types";
import { computeVat } from "@/lib/vat";
import { Money } from "./money";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const schema = z
  .object({
    register: z.enum(["sales", "purchase"]),
    docType: z.enum(["invoice", "correction", "advance", "receipt"]),
    number: z.string().trim().min(1, "Podaj numer dokumentu").max(40, "Numer jest za długi (maks. 40 znaków)"),
    issueDate: z.string().min(1, "Podaj datę wystawienia").regex(ISO, "Wpisz datę jako dd.mm.rrrr"),
    saleDate: z.string().refine((v) => v === "" || ISO.test(v), "Wpisz datę jako dd.mm.rrrr"),
    name: z.string().trim().min(2, "Podaj nazwę kontrahenta"),
    nip: z
      .string()
      .trim()
      .min(1, "Podaj NIP kontrahenta")
      .refine((v) => /^\d{10}$/.test(normalizeNip(v)), "NIP ma 10 cyfr")
      .refine((v) => !/^\d{10}$/.test(normalizeNip(v)) || isValidNip(v), "Niepoprawny NIP — suma kontrolna się nie zgadza"),
    city: z.string().trim(),
    net: z
      .string()
      .trim()
      .min(1, "Podaj kwotę netto")
      .refine((v) => !Number.isNaN(parseAmount(v)), "Wpisz kwotę, np. 1 250,00"),
    vatRate: z.enum(["23", "8", "5", "0", "zw", "np"]),
    jpkCodes: z.array(z.string()),
    description: z.string().trim().max(200, "Maks. 200 znaków"),
  })
  .superRefine((v, ctx) => {
    const n = parseAmount(v.net);
    if (!Number.isNaN(n)) {
      if (v.docType === "correction" && n === 0) ctx.addIssue({ code: "custom", path: ["net"], message: "Korekta musi zmieniać kwotę" });
      if (v.docType !== "correction" && n <= 0) ctx.addIssue({ code: "custom", path: ["net"], message: "Kwota musi być większa od zera (ujemna tylko w korekcie)" });
    }
    if (ISO.test(v.saleDate) && ISO.test(v.issueDate) && (new Date(v.saleDate).getTime() - new Date(v.issueDate).getTime()) / 86_400_000 > 30)
      ctx.addIssue({ code: "custom", path: ["saleDate"], message: "Data sprzedaży może być najwyżej 30 dni po wystawieniu" });
  });

type Values = z.infer<typeof schema>;
type Name = keyof Values;

const fieldLabel: Partial<Record<Name, string>> = {
  nip: "NIP",
  name: "Nazwa kontrahenta",
  number: "Numer dokumentu",
  issueDate: "Data wystawienia",
  saleDate: "Data sprzedaży",
  net: "Netto",
  description: "Opis",
};
const order: Name[] = ["nip", "name", "number", "issueDate", "saleDate", "net", "description"];
const commonCodes = ["GTU_02", "GTU_07", "GTU_12", "MPP", "TP"];

function Field({ label, id, error, hint, children, className }: { label: string; id: string; error?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-medium text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="flex items-start gap-1.5 text-small text-er-soft-ink">
          <AlertOctagon className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      ) : hint ? (
        <div className="text-small text-ink-3">{hint}</div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
      <legend className="col-span-full pb-4 text-title">{title}</legend>
      {children}
    </fieldset>
  );
}

function toValues(entry: RegisterEntry | null, register: RegisterKind, period: Period, today: string): Values {
  if (entry)
    return {
      register: entry.register,
      docType: entry.docType,
      number: entry.number,
      issueDate: entry.issueDate,
      saleDate: entry.saleDate,
      name: entry.counterparty.name,
      nip: formatNip(entry.counterparty.nip),
      city: entry.counterparty.city,
      net: formatAmount(entry.net),
      vatRate: entry.vatRate,
      jpkCodes: entry.jpkCodes,
      description: entry.description,
    };
  const ym = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const date = today.startsWith(ym) ? today : `${ym}-01`;
  return { register, docType: "invoice", number: "", issueDate: date, saleDate: date, name: "", nip: "", city: "", net: "", vatRate: "23", jpkCodes: [], description: "" };
}

/**
 * Add / edit [docs/REDESIGN-PLAN.md §2.4]. ≥768 right panel 560 with scrim, phone drawer.
 * `fix` opens the form from a KSeF rejection with that field highlighted and focused.
 */
export function EntryForm({
  open,
  onOpenChange,
  entry,
  register,
  period,
  today,
  onSubmit,
  onOpenExisting,
  fix,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entry: RegisterEntry | null;
  register: RegisterKind;
  period: Period;
  today: string;
  onSubmit: (draft: EntryDraft) => Promise<void>;
  onOpenExisting?: (id: string) => void;
  fix?: { field: FixField; message: string };
}) {
  const desktop = useIsDesktop();
  const uid = useId();
  const [summary, setSummary] = useState<Name[]>([]);
  const [duplicateId, setDuplicateId] = useState<string>();
  const [discardOpen, setDiscardOpen] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(entry, register, period, today), mode: "onTouched" });
  const {
    register: reg,
    handleSubmit,
    control,
    reset,
    setError,
    setFocus,
    setValue,
    formState: { errors, isSubmitting, isDirty, touchedFields },
  } = form;

  // reset transient UI each time the form opens (adjusting state during render, not in an effect)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSummary([]);
      setDuplicateId(undefined);
    }
  }

  useEffect(() => {
    if (!open) return;
    reset(toValues(entry, register, period, today));
    if (fix) {
      const t = setTimeout(() => {
        setError(fix.field, { type: "ksef", message: fix.message });
        setFocus(fix.field);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open, entry, register, period, today, reset, fix, setError, setFocus]);

  const [net, rate, issueDate, docType, number, nip] = useWatch({ control, name: ["net", "vatRate", "issueDate", "docType", "number", "nip"] });
  const parsed = parseAmount(net ?? "");
  const preview = Number.isNaN(parsed) ? null : computeVat(parsed, rate as VatRate);
  const issuePeriod = issueDate && ISO.test(issueDate) ? { year: Number(issueDate.slice(0, 4)), month: Number(issueDate.slice(5, 7)) } : null;
  const otherPeriod = issuePeriod && (issuePeriod.year !== period.year || issuePeriod.month !== period.month);
  const nipOk = !errors.nip && touchedFields.nip && isValidNip(nip ?? "");

  const onInvalid = (errs: FieldErrors<Values>) => setSummary(order.filter((n) => errs[n]));
  const submit = handleSubmit(async (v) => {
    setSummary([]);
    setDuplicateId(undefined);
    try {
      await onSubmit({
        register: v.register,
        docType: v.docType as DocType,
        number: v.number.trim(),
        issueDate: v.issueDate,
        saleDate: v.saleDate || v.issueDate,
        counterparty: { name: v.name.trim(), nip: normalizeNip(v.nip), city: v.city.trim() },
        description: v.description.trim() || docTypeLabel[v.docType as DocType],
        vatRate: v.vatRate as VatRate,
        net: parseAmount(v.net),
        jpkCodes: v.jpkCodes,
      });
    } catch (e) {
      if (e instanceof ApiError && e.field) {
        setError(e.field as Name, { message: e.message }, { shouldFocus: true });
        if (e.code === "DUPLICATE") setDuplicateId(e.ref);
      } else setError("root", { message: "Nie zapisano. Spróbuj ponownie." });
    }
  }, onInvalid);

  const requestClose = (o: boolean) => {
    if (!o && isDirty && !isSubmitting) setDiscardOpen(true);
    else onOpenChange(o);
  };

  const id = (n: string) => `${uid}-${n}`;
  const a11y = (n: Name) => ({ id: id(n), "aria-invalid": !!errors[n] || undefined, "aria-describedby": errors[n] ? `${id(n)}-err` : undefined });

  const title = entry ? "Edytuj dokument" : "Nowy dokument";
  const description = entry ? `${entry.number} · ${entry.counterparty.name}` : "Kwoty VAT i brutto policzymy za Ciebie.";

  const fields = (
    <form id={id("form")} onSubmit={submit} noValidate className="flex flex-col gap-8">
      {summary.length > 0 && (
        <div role="alert" className="flex gap-3 rounded-lg bg-er-soft px-4 py-3 text-body text-er-soft-ink">
          <AlertOctagon className="mt-0.5 size-4.5 shrink-0" />
          <div>
            <p className="font-medium">Popraw {summary.length === 1 ? "1 pole" : `${summary.length} pola`}, aby zapisać</p>
            <ul className="mt-1 flex flex-wrap gap-x-3 text-small">
              {summary.map((n) => (
                <li key={n}>
                  <button type="button" className="rounded-xs underline underline-offset-3" onClick={() => setFocus(n)}>
                    {fieldLabel[n]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {fix && (
        <p className="flex gap-3 rounded-lg bg-accent-soft px-4 py-3 text-body text-accent-soft-ink">
          <Info className="mt-0.5 size-4.5 shrink-0" />
          Po zapisie wyślemy fakturę ponownie do KSeF.
        </p>
      )}

      {!entry && (
        <Controller
          control={control}
          name="register"
          render={({ field }) => (
            <ToggleGroup type="single" value={field.value} onValueChange={(v) => v && field.onChange(v)} aria-label="Rejestr" className="w-full">
              {(["sales", "purchase"] as RegisterKind[]).map((r) => (
                <ToggleGroupItem key={r} value={r}>
                  {registerLabel[r]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
      )}

      <Section title="Kontrahent">
        <Field label="NIP" id={id("nip")} error={errors.nip?.message}>
          <div className="relative">
            <Input
              {...reg("nip", {
                onBlur: (ev) => {
                  const n = normalizeNip(ev.target.value);
                  if (/^\d{10}$/.test(n)) setValue("nip", formatNip(n), { shouldDirty: true });
                },
              })}
              {...a11y("nip")} className="tnum pr-10" placeholder="10 cyfr" inputMode="numeric" autoComplete="off" />
            {nipOk && <CircleCheck aria-label="NIP poprawny" className="absolute top-1/2 right-3 size-4.5 -translate-y-1/2 text-ok-soft-ink" />}
          </div>
        </Field>
        <Field label="Nazwa" id={id("name")} error={errors.name?.message}>
          <Input {...reg("name")} {...a11y("name")} placeholder="Nazwa firmy" autoComplete="organization" />
        </Field>
        <Field label="Miejscowość" id={id("city")} hint="Opcjonalnie">
          <Input {...reg("city")} id={id("city")} />
        </Field>
      </Section>

      <Section title="Dokument">
        <Field label="Rodzaj operacji" id={id("docType")}>
          <Controller
            control={control}
            name="docType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id("docType")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {docTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {docTypeLabel[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field
          label="Numer dokumentu"
          id={id("number")}
          error={errors.number?.message}
          hint={number?.trim() ? `Seria: ${seriesOf(number)}` : "np. FV/2026/10/025"}
        >
          <Input {...reg("number")} {...a11y("number")} className="tnum" autoComplete="off" />
          {duplicateId && onOpenExisting && (
            <Button type="button" variant="text" className="self-start text-small" onClick={() => onOpenExisting(duplicateId)}>
              Otwórz istniejący
            </Button>
          )}
        </Field>
        <Field label="Data wystawienia" id={id("issueDate")} error={errors.issueDate?.message}>
          <Controller
            control={control}
            name="issueDate"
            render={({ field }) => (
              <DateField
                ref={field.ref}
                id={id("issueDate")}
                label="Data wystawienia"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                today={today}
                min="2025-01-01"
                max="2026-12-31"
                invalid={!!errors.issueDate}
                describedBy={errors.issueDate ? `${id("issueDate")}-err` : undefined}
              />
            )}
          />
        </Field>
        <Field label="Data sprzedaży" id={id("saleDate")} error={errors.saleDate?.message}>
          <Controller
            control={control}
            name="saleDate"
            render={({ field }) => (
              <DateField
                ref={field.ref}
                id={id("saleDate")}
                label="Data sprzedaży"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                today={today}
                min="2025-01-01"
                max="2026-12-31"
                invalid={!!errors.saleDate}
                describedBy={errors.saleDate ? `${id("saleDate")}-err` : undefined}
              />
            )}
          />
        </Field>
        {otherPeriod && issuePeriod && (
          <p className="col-span-full flex items-start gap-2 text-small text-wa-soft-ink">
            <Info className="mt-0.5 size-4 shrink-0" />
            Data wystawienia w okresie {formatPeriod(issuePeriod.year, issuePeriod.month).toLowerCase()}: dokument trafi do tego okresu.
          </p>
        )}
      </Section>

      <Section title="Kwoty">
        <Field label="Stawka VAT" id={id("vatRate")}>
          <Controller
            control={control}
            name="vatRate"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={id("vatRate")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vatRates.map((r) => (
                    <SelectItem key={r} value={r}>
                      {vatRateLabel[r]}
                      {r === "zw" ? " — zwolnione" : r === "np" ? " — nie podlega" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label={docType === "correction" ? "Netto (zmiana)" : "Netto"} id={id("net")} error={errors.net?.message}>
          <div className="relative">
            <Input {...reg("net")} {...a11y("net")} className="tnum pr-10 text-right" placeholder="0,00" inputMode="decimal" autoComplete="off" />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-body text-ink-3">zł</span>
          </div>
        </Field>
        <p aria-live="polite" className="col-span-full flex flex-wrap items-baseline gap-x-6 gap-y-1 text-body text-ink-2">
          <span>
            VAT {preview ? <Money value={preview.vat} variant="display" className="font-display text-display-3" /> : <span className="text-ink-3">—</span>}
          </span>
          <span>
            Brutto {preview ? <Money value={preview.gross} variant="display" className="font-display text-display-3" /> : <span className="text-ink-3">—</span>}
          </span>
        </p>
      </Section>

      <Controller
        control={control}
        name="jpkCodes"
        render={({ field }) => {
          const shown = [...new Set([...commonCodes, ...field.value])];
          const extra = [...jpkCodeOptions.gtu, ...jpkCodeOptions.procedures].filter((c) => !shown.includes(c));
          const toggle = (c: string) => field.onChange(field.value.includes(c) ? field.value.filter((x) => x !== c) : [...field.value, c]);
          return (
            <fieldset className="flex flex-col gap-2.5">
              <legend className="pb-2.5 text-title">Kod JPK V7</legend>
              <div className="flex flex-wrap gap-1.5">
                {shown.map((c) => (
                  <Toggle key={c} pressed={field.value.includes(c)} onPressedChange={() => toggle(c)}>
                    {field.value.includes(c) && <Check />}
                    {c.replace("_", " ")}
                  </Toggle>
                ))}
                <Select value="" onValueChange={toggle}>
                  <SelectTrigger size="sm" aria-label="Dodaj inny kod JPK" className="h-8 w-auto rounded-pill px-3 text-small shadow-none touch:h-9">
                    <SelectValue placeholder="+ inny kod" />
                  </SelectTrigger>
                  <SelectContent>
                    {extra.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </fieldset>
          );
        }}
      />

      <Field label="Opis" id={id("description")} error={errors.description?.message}>
        <Textarea {...reg("description")} {...a11y("description")} rows={2} placeholder="np. Usługi programistyczne — październik" />
      </Field>
      {errors.root && (
        <p role="alert" className="text-small text-er-soft-ink">
          {errors.root.message}
        </p>
      )}
    </form>
  );

  const buttons = (
    <>
      <Button type="button" onClick={() => requestClose(false)}>
        Anuluj
      </Button>
      <Button type="submit" form={id("form")} variant="primary" loading={isSubmitting}>
        {isSubmitting ? "Zapisywanie…" : entry ? "Zapisz zmiany" : "Zapisz"}
      </Button>
    </>
  );

  const discard = (
    <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Odrzucić zmiany?</AlertDialogTitle>
          <AlertDialogDescription>Wpisane dane nie zostaną zapisane.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Wróć do formularza</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={() => onOpenChange(false)}>
            Odrzuć
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (desktop)
    return (
      <>
        <Sheet open={open} onOpenChange={requestClose}>
          <SheetContent size="form" onEscapeKeyDown={(e) => isDirty && (e.preventDefault(), setDiscardOpen(true))}>
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <SheetBody className="pt-4">{fields}</SheetBody>
            <SheetFooter>{buttons}</SheetFooter>
          </SheetContent>
        </Sheet>
        {discard}
      </>
    );
  return (
    <>
      <Drawer open={open} onOpenChange={requestClose} repositionInputs={false}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>{fields}</DrawerBody>
          <DrawerFooter className="flex-row *:flex-1">{buttons}</DrawerFooter>
        </DrawerContent>
      </Drawer>
      {discard}
    </>
  );
}
