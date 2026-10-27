"use client";
import { useState } from "react";
import type { ColumnOrderState, VisibilityState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { defaultColumnOrder, defaultColumnVisibility, lockedColumns, managedColumns } from "./entries-table";

const label = Object.fromEntries(managedColumns.map((c) => [c.id, c.label]));

/** ⋯ → Kolumny [B26]: replaces the original's drag handles on headers. Drag, or ↑/↓ for keyboards. */
export function ColumnManager({
  open,
  onOpenChange,
  order,
  visibility,
  onChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  order: ColumnOrderState;
  visibility: VisibilityState;
  onChange: (order: ColumnOrderState, visibility: VisibilityState) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const move = (id: string, to: number) => {
    const next = order.filter((x) => x !== id);
    next.splice(Math.max(0, Math.min(next.length, to)), 0, id);
    onChange(next, visibility);
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Kolumny</SheetTitle>
          <SheetDescription>Wybierz, co pokazuje tabela, i ustaw kolejność. Kontrahent i Brutto są zawsze widoczne.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <ol className="flex flex-col">
            {order.map((id, i) => {
              const locked = lockedColumns.has(id);
              const visible = visibility[id] !== false;
              return (
                <li
                  key={id}
                  draggable
                  onDragStart={() => setDragId(id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dragId && dragId !== id && move(dragId, i)}
                  onDragEnd={() => setDragId(null)}
                  className={cn("flex min-h-12 items-center gap-3 rounded-sm px-1", dragId === id && "bg-surface-selected")}
                >
                  <GripVertical aria-hidden className="size-4.5 shrink-0 cursor-grab text-ink-3" />
                  <label className={cn("flex flex-1 items-center gap-3 text-body", locked && "text-ink-2")}>
                    <Checkbox
                      checked={visible}
                      disabled={locked}
                      onCheckedChange={(v) => onChange(order, { ...visibility, [id]: !!v })}
                    />
                    {label[id]}
                  </label>
                  <Button variant="ghost" size="icon-sm" aria-label={`Przesuń ${label[id]} wyżej`} disabled={i === 0} onClick={() => move(id, i - 1)}>
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Przesuń ${label[id]} niżej`} disabled={i === order.length - 1} onClick={() => move(id, i + 1)}>
                    <ArrowDown />
                  </Button>
                </li>
              );
            })}
          </ol>
        </SheetBody>
        <SheetFooter>
          <Button variant="text" className="mr-auto" onClick={() => onChange(defaultColumnOrder, defaultColumnVisibility)}>
            Przywróć domyślne
          </Button>
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            Gotowe
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
