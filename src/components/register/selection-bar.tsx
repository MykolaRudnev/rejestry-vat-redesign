"use client";
import { FileSpreadsheet, Printer, Send, Tag, Trash2, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { plural } from "@/lib/labels";

export interface BulkAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export const bulkIcons = { send: Send, tag: Tag, export: FileSpreadsheet, print: Printer, delete: Trash2 };

/**
 * Appears when ≥1 row is checked [B9]. Desktop: an inverse bar floating over the sheet.
 * Phone: replaces the bottom nav.
 */
export function SelectionBar({ count, actions, onClear }: { count: number; actions: BulkAction[]; onClear: () => void }) {
  if (!count) return null;
  return (
    <div
      role="toolbar"
      aria-label="Akcje dla zaznaczonych dokumentów"
      className="no-print rise-in fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 bg-surface-inverse px-2 pt-1 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] text-ink-inverse shadow-overlay md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:rounded-lg md:px-2 md:py-2 lg:ml-[calc(var(--sidebar-w)/2)]"
    >
      <button type="button" onClick={onClear} aria-label="Odznacz wszystkie" className="focus-knockout grid size-11 shrink-0 place-items-center rounded-md hover:bg-ink-inverse/10">
        <X className="size-5" />
      </button>
      <p className="tnum shrink-0 pr-2 text-body font-medium whitespace-nowrap">
        {count} <span className="max-sm:hidden">{plural(count, "zaznaczony", "zaznaczone", "zaznaczonych")}</span>
      </p>
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex-none">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={a.disabled}
            onClick={a.onSelect}
            className={cn(
              "focus-knockout flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-body whitespace-nowrap hover:bg-ink-inverse/10 disabled:opacity-50 max-md:flex-col max-md:justify-center max-md:gap-0.5 max-md:px-2 max-md:text-micro",
              a.destructive && "text-er-on-inverse",
            )}
          >
            <a.icon className="size-4.5 shrink-0" strokeWidth={1.75} />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
