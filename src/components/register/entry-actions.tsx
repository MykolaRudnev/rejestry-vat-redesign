"use client";
import { Copy, Eye, MoreHorizontal, Pencil, Printer, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionMenu } from "@/components/ui/action-menu";
import { canSendKsef } from "@/lib/ksef";
import type { RegisterEntry } from "@/lib/types";

export { canSendKsef };

export interface EntryHandlers {
  onOpen: (e: RegisterEntry) => void;
  onEdit: (e: RegisterEntry) => void;
  onSendKsef: (e: RegisterEntry) => void;
  onCopy: (text: string, label: string) => void;
  onDelete: (e: RegisterEntry) => void;
  onPrint: (e: RegisterEntry) => void;
  locked: boolean;
}

/** Accepted invoices are frozen: a change needs a correction invoice (owner decision). */
export const editBlock = (e: RegisterEntry, locked: boolean) =>
  locked ? "Okres jest potwierdzony" : e.register === "sales" && e.ksef.status === "accepted" ? "Faktura przyjęta w KSeF. Zmiana wymaga korekty." : undefined;

/** Row ⋯ [B28]: the same actions as the detail panel. */
export function EntryActions({ entry, handlers, className }: { entry: RegisterEntry; handlers: EntryHandlers; className?: string }) {
  const { onOpen, onEdit, onSendKsef, onCopy, onDelete, onPrint, locked } = handlers;
  const blocked = editBlock(entry, locked);
  return (
    <ActionMenu
      title={entry.number}
      modal={false}
      className="w-64"
      trigger={
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn(
            "grid size-8 place-items-center rounded-sm text-ink-2 transition-colors duration-(--dur-fast) hover:bg-surface-pressed hover:text-ink-1 aria-expanded:bg-surface-pressed",
            className,
          )}
          aria-label={`Akcje dla dokumentu ${entry.number}`}
        >
          <MoreHorizontal className="size-4.5" />
        </button>
      }
      groups={[
        {
          items: [
            { id: "open", label: "Otwórz", icon: Eye, shortcut: "↵", onSelect: () => onOpen(entry) },
            canSendKsef(entry) && {
              id: "send",
              label: entry.ksef.status === "rejected" ? "Wyślij ponownie do KSeF" : "Wyślij do KSeF",
              icon: Send,
              disabled: locked,
              onSelect: () => onSendKsef(entry),
            },
            { id: "edit", label: "Edytuj", icon: Pencil, disabled: !!blocked, hint: blocked, onSelect: () => onEdit(entry) },
            { id: "print", label: "Drukuj dokument", icon: Printer, onSelect: () => onPrint(entry) },
          ],
        },
        {
          items: [
            { id: "copy", label: "Kopiuj numer dokumentu", icon: Copy, onSelect: () => onCopy(entry.number, "Numer dokumentu") },
            !!entry.ksef.number && { id: "copy-ksef", label: "Kopiuj numer KSeF", icon: Copy, onSelect: () => onCopy(entry.ksef.number!, "Numer KSeF") },
          ],
        },
        {
          items: [
            { id: "delete", label: "Usuń z rejestru", icon: Trash2, destructive: true, disabled: !!blocked, hint: blocked, onSelect: () => onDelete(entry) },
          ],
        },
      ]}
    />
  );
}
