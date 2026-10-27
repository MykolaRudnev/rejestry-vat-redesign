"use client";
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
  FileCode2,
  FileSpreadsheet,
  Plus,
  Printer,
  RotateCw,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { CompanyAvatar } from "@/components/shell/company-avatar";
import { formatMoney, formatNip } from "@/lib/format";
import type { Company, RegisterEntry, RegisterKind } from "@/lib/types";

export interface PaletteActions {
  add: () => void;
  confirmPeriod?: () => void;
  exportCsv: () => void;
  print: () => void;
  jpk: () => void;
  sync: () => void;
  refresh: () => void;
  switchRegister: (r: RegisterKind) => void;
  prevPeriod?: () => void;
  nextPeriod?: () => void;
  showAttention?: () => void;
  openEntry: (e: RegisterEntry) => void;
  switchCompany: (id: string) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  actions,
  entries,
  companies,
  companyId,
  register,
  locked,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  actions: PaletteActions;
  entries: RegisterEntry[];
  companies: Company[];
  companyId: string;
  register: RegisterKind;
  locked: boolean;
}) {
  const run = (fn?: () => void) => () => {
    onOpenChange(false);
    fn?.();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="top-[10%] translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 sm:top-[18%] sm:max-w-[560px]">
        <DialogTitle className="sr-only">Szukaj i działaj</DialogTitle>
        <DialogDescription className="sr-only">Wpisz polecenie, numer dokumentu albo kontrahenta</DialogDescription>
        <Command className="p-1.5" loop>
      <CommandInput placeholder="Wpisz polecenie, numer dokumentu lub kontrahenta…" />
      <CommandList className="max-h-[min(420px,60dvh)]">
        <CommandEmpty>Nic nie znaleziono.</CommandEmpty>
        <CommandGroup heading="Akcje">
          {!locked && (
            <CommandItem onSelect={run(actions.add)}>
              <Plus /> Dodaj dokument <CommandShortcut>N</CommandShortcut>
            </CommandItem>
          )}
          {actions.showAttention && (
            <CommandItem onSelect={run(actions.showAttention)}>
              <AlertTriangle /> Pokaż dokumenty wymagające uwagi w KSeF
            </CommandItem>
          )}
          {actions.confirmPeriod && (
            <CommandItem onSelect={run(actions.confirmPeriod)}>
              <CalendarCheck /> Potwierdź okres
            </CommandItem>
          )}
          <CommandItem onSelect={run(actions.sync)}>
            <DownloadCloud /> Pobierz faktury z KSeF
          </CommandItem>
          <CommandItem onSelect={run(actions.jpk)}>
            <FileCode2 /> Podgląd JPK (XML)
          </CommandItem>
          <CommandItem onSelect={run(actions.exportCsv)}>
            <FileSpreadsheet /> Eksportuj do CSV
          </CommandItem>
          <CommandItem onSelect={run(actions.print)}>
            <Printer /> Drukuj rejestr
          </CommandItem>
          <CommandItem onSelect={run(actions.refresh)}>
            <RotateCw /> Odśwież dane
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Widok">
          <CommandItem onSelect={run(() => actions.switchRegister(register === "sales" ? "purchase" : "sales"))}>
            <ArrowLeftRight /> {register === "sales" ? "Przejdź do rejestru zakupów" : "Przejdź do rejestru sprzedaży"}
          </CommandItem>
          {actions.prevPeriod && (
            <CommandItem onSelect={run(actions.prevPeriod)}>
              <ChevronLeft /> Poprzedni miesiąc
            </CommandItem>
          )}
          {actions.nextPeriod && (
            <CommandItem onSelect={run(actions.nextPeriod)}>
              <ChevronRight /> Następny miesiąc
            </CommandItem>
          )}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Firmy">
          {companies
            .filter((c) => c.id !== companyId)
            .map((c) => (
              <CommandItem key={c.id} value={`firma ${c.name} ${c.nip}`} onSelect={run(() => actions.switchCompany(c.id))}>
                <CompanyAvatar company={c} className="size-5 text-[9px]" />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="tnum text-small text-ink-2">{formatNip(c.nip)}</span>
              </CommandItem>
            ))}
        </CommandGroup>
        {entries.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Dokumenty w tym okresie">
              {entries.map((e) => (
                <CommandItem
                  key={e.id}
                  value={`${e.number} ${e.counterparty.name} ${e.counterparty.nip} ${e.identifier}`}
                  onSelect={run(() => actions.openEntry(e))}
                >
                  <span className="min-w-0 flex-1">
                    <span className="tnum block truncate">{e.number}</span>
                    <span className="block truncate text-small text-ink-2">{e.counterparty.name}</span>
                  </span>
                  <span className="tnum text-small text-ink-2">{formatMoney(e.gross)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
