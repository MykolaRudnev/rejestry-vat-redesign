"use client";
import { useState } from "react";
import { Check, ChevronsUpDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Overlay } from "@/components/ui/overlay";
import { periodInfo } from "@/lib/api";
import { TODAY } from "@/data/companies";
import { formatNip } from "@/lib/format";
import type { Company } from "@/lib/types";
import { CompanyAvatar } from "./company-avatar";

/** Company switcher [B1]; its footer opens "Obszary i dostępność" [A5]. */
export function CompanySwitcher({
  company,
  companies,
  onChange,
  onOpenAreas,
  variant = "full",
  className,
}: {
  company: Company;
  companies: Company[];
  onChange: (id: string) => void;
  onOpenAreas: () => void;
  variant?: "full" | "compact" | "icon";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const trigger = (
    <button
      type="button"
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-md text-left transition-colors duration-(--dur-fast) hover:bg-surface-hover aria-expanded:bg-surface-pressed",
        variant === "icon" ? "size-12 justify-center" : "h-12 px-2",
        className,
      )}
      aria-label={`Firma: ${company.name}. Zmień firmę`}
    >
      <CompanyAvatar company={company} on={variant === "compact" ? "sheet" : "desk"} />
      {variant !== "icon" && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-title">{company.shortName}</span>
            {variant === "full" && <span className="tnum block truncate text-small text-ink-2">NIP {formatNip(company.nip)}</span>}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-ink-2" />
        </>
      )}
    </button>
  );

  return (
    <Overlay
      trigger={trigger}
      title="Firmy klientów"
      open={open}
      onOpenChange={setOpen}
      side={variant === "icon" ? "right" : "bottom"}
      className="w-90 p-0"
    >
      <Command>
        <CommandInput placeholder="Szukaj firmy lub NIP…" />
        <CommandList>
          <CommandEmpty>Brak firmy o tej nazwie.</CommandEmpty>
          <CommandGroup heading="Firmy klientów">
            {companies.map((c) => (
              <CommandItem
                key={c.id}
                value={`${c.name} ${c.nip}`}
                onSelect={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className="min-h-14 gap-3"
              >
                <CompanyAvatar company={c} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{c.name}</span>
                  <span className="tnum block text-small text-ink-2">
                    NIP {formatNip(c.nip)} · JPK_{c.vatScheme}
                  </span>
                </span>
                {!periodInfo(c.id, Number(TODAY.slice(0, 4)), Number(TODAY.slice(5, 7))).confirmed && (
                  <span role="img" aria-label="Okres wymaga potwierdzenia" className="size-1.5 shrink-0 rounded-pill bg-wa-fill" />
                )}
                <span className="grid w-4.5 shrink-0 place-items-center">
                  {c.id === company.id && <Check className="size-4.5 text-accent-text!" aria-label="Wybrana" />}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
      <div className="px-1.5 pb-1.5">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onOpenAreas();
          }}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-sm px-2.5 text-body text-accent-text hover:bg-surface-hover"
        >
          <LayoutGrid className="size-4.5" /> Obszary i dostępność
        </button>
      </div>
    </Overlay>
  );
}
