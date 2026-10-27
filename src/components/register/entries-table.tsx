"use client";
import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnOrderState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateShort, formatNip } from "@/lib/format";
import { docTypeLabel, plural, vatRateLabel } from "@/lib/labels";
import type { RegisterEntry } from "@/lib/types";
import { EntryActions, type EntryHandlers } from "./entry-actions";
import { KsefNumber, KsefStatusLabel } from "./ksef-status";
import { Money } from "./money";

type Meta = { className?: string; align?: "right" };

/** Columns the user can show/hide and reorder (⋯ → Kolumny) [B26]. Default order from REDESIGN-PLAN §2.1. */
export const managedColumns = [
  { id: "issueDate", label: "Data" },
  { id: "counterparty", label: "Kontrahent" },
  { id: "number", label: "Numer dokumentu" },
  { id: "ksef", label: "Numer KSeF" },
  { id: "identifier", label: "Identyfikator" },
  { id: "vatRate", label: "Stawka VAT" },
  { id: "net", label: "Netto" },
  { id: "vat", label: "VAT" },
  { id: "gross", label: "Brutto" },
] as const;
export const defaultColumnOrder = managedColumns.map((c) => c.id) as string[];
/** Stawka VAT is on, but only fits (and shows) at table width ≥1400px. */
export const defaultColumnVisibility: VisibilityState = {};
/** Columns that must stay visible so a row is still identifiable. */
export const lockedColumns = new Set(["counterparty", "gross"]);

/**
 * Desktop register table (DS §8 Table rows). Columns drop by container width, not viewport:
 * Identyfikator < 1072px, Netto < 928px; < 864px the KSeF number goes (status stays) and Data folds into the number line. Kontrahent takes the rest.
 */
export function EntriesTable({
  entries,
  handlers,
  selectedId,
  flashId,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  columnVisibility,
  columnOrder,
  rowSelection,
  onRowSelectionChange,
}: {
  entries: RegisterEntry[];
  handlers: EntryHandlers;
  selectedId?: string;
  flashId?: string;
  sorting: SortingState;
  onSortingChange: (s: SortingState) => void;
  pagination: PaginationState;
  onPaginationChange: (p: PaginationState) => void;
  columnVisibility: VisibilityState;
  columnOrder: ColumnOrderState;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (s: RowSelectionState) => void;
}) {
  const anySelected = Object.keys(rowSelection).length > 0;
  const columns = useMemo<ColumnDef<RegisterEntry>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        meta: { className: "w-9 pl-1.5" } satisfies Meta,
        header: ({ table }) => (
          <Checkbox
            aria-label="Zaznacz wszystkie na stronie"
            checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            className={cn("fine:opacity-0 fine:group-hover/table:opacity-100 focus-visible:opacity-100", anySelected && "fine:opacity-100")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Zaznacz ${row.original.number}`}
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className={cn("fine:opacity-0 fine:group-hover/row:opacity-100 focus-visible:opacity-100", anySelected && "fine:opacity-100")}
          />
        ),
      },
      {
        id: "issueDate",
        accessorFn: (e) => e.issueDate + e.identifier,
        header: "Data",
        meta: { className: "w-17 @max-[54rem]/reg:hidden" } satisfies Meta,
        cell: ({ row }) => <span className="tnum whitespace-nowrap text-ink-2">{formatDateShort(row.original.issueDate)}</span>,
      },
      {
        id: "counterparty",
        accessorFn: (e) => e.counterparty.name,
        header: "Kontrahent",
        // capped so the name stays near the amounts on wide screens; spare width spreads over all columns
        meta: { className: "w-[clamp(11rem,16cqw,26rem)]" } satisfies Meta,
        sortingFn: (a, b) => a.original.counterparty.name.localeCompare(b.original.counterparty.name, "pl"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-ink-1">{row.original.counterparty.name}</p>
            <p className="tnum truncate text-small text-ink-2">NIP {formatNip(row.original.counterparty.nip)}</p>
          </div>
        ),
      },
      {
        id: "number",
        accessorKey: "number",
        header: "Numer dokumentu",
        meta: { className: "w-40" } satisfies Meta,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="tnum truncate text-ink-1">{row.original.number}</p>
            <p className="truncate text-small text-ink-2">
              <span className="tnum hidden @max-[54rem]/reg:inline">{formatDateShort(row.original.issueDate)} · </span>
              {docTypeLabel[row.original.docType]}
            </p>
          </div>
        ),
      },
      {
        id: "ksef",
        accessorFn: (e) => e.ksef.status,
        header: () => (
          <>
            <span className="@max-[54rem]/reg:hidden">Numer KSeF</span>
            <span className="hidden @max-[54rem]/reg:inline" aria-label="Numer KSeF">
              KSeF
            </span>
          </>
        ),
        enableSorting: false,
        meta: { className: "w-45 @max-[54rem]/reg:w-34 @min-[87.5rem]/reg:w-74" } satisfies Meta,
        cell: ({ row }) => (
          <div className="min-w-0">
            <KsefStatusLabel status={row.original.ksef.status} />
            <KsefNumber ksef={row.original.ksef} className="mt-0.5 block @max-[54rem]/reg:hidden @min-[87.5rem]/reg:hidden" />
            {row.original.ksef.number && (
              <span className="mt-0.5 hidden font-mono text-mono text-ink-2 @min-[87.5rem]/reg:block">{row.original.ksef.number}</span>
            )}
            {!row.original.ksef.number && <KsefNumber ksef={row.original.ksef} className="mt-0.5 hidden @min-[87.5rem]/reg:block" />}
          </div>
        ),
      },
      {
        id: "identifier",
        accessorKey: "identifier",
        header: "Identyfikator",
        meta: { className: "w-28 @max-[67rem]/reg:hidden" } satisfies Meta,
        cell: ({ row }) => <span className="tnum text-ink-2">{row.original.identifier}</span>,
      },
      {
        id: "vatRate",
        accessorKey: "vatRate",
        header: "Stawka",
        meta: { className: "w-20 @max-[87.5rem]/reg:hidden", align: "right" } satisfies Meta,
        cell: ({ row }) => <span className="tnum text-ink-2">{vatRateLabel[row.original.vatRate]}</span>,
      },
      {
        id: "net",
        accessorKey: "net",
        header: "Netto",
        meta: { className: "w-24 @max-[58rem]/reg:hidden", align: "right" } satisfies Meta,
        cell: ({ row }) => <Money value={row.original.net} />,
      },
      {
        id: "vat",
        accessorKey: "vat",
        header: "VAT",
        meta: { className: "w-20", align: "right" } satisfies Meta,
        cell: ({ row }) => <Money value={row.original.vat} />,
      },
      {
        id: "gross",
        accessorKey: "gross",
        header: "Brutto, zł",
        meta: { className: "w-28", align: "right" } satisfies Meta,
        cell: ({ row }) => <Money value={row.original.gross} className="font-medium" />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Akcje</span>,
        enableSorting: false,
        meta: { className: "w-10 pr-1" } satisfies Meta,
        cell: ({ row }) => (
          <EntryActions
            entry={row.original}
            handlers={handlers}
            className="fine:opacity-0 fine:group-hover/row:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
          />
        ),
      },
    ],
    [handlers, anySelected],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: entries,
    columns,
    getRowId: (e) => e.id,
    state: { sorting, pagination, columnVisibility, columnOrder: ["select", ...columnOrder, "actions"], rowSelection },
    onSortingChange: (u) => onSortingChange(typeof u === "function" ? u(sorting) : u),
    onPaginationChange: (u) => onPaginationChange(typeof u === "function" ? u(pagination) : u),
    onRowSelectionChange: (u) => onRowSelectionChange(typeof u === "function" ? u(rowSelection) : u),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const total = entries.length;
  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize);
  const pageBtn =
    "grid size-10 place-items-center rounded-md text-ink-2 transition-colors duration-(--dur-fast) hover:bg-surface-hover hover:text-ink-1 disabled:text-ink-disabled disabled:hover:bg-transparent";

  return (
    <div className="@container/reg">
      <table className="group/table w-full table-fixed border-separate border-spacing-0 text-body">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => {
                const meta = h.column.columnDef.meta as Meta | undefined;
                const sorted = h.column.getIsSorted();
                return (
                  <th
                    key={h.id}
                    scope="col"
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                    className={cn(
                      "sticky top-(--toolbar-h) z-10 h-10 border-b border-line-subtle bg-surface-sheet px-2.5 text-left text-small font-medium whitespace-nowrap text-ink-2",
                      meta?.align === "right" && "text-right",
                      meta?.className,
                    )}
                  >
                    {h.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className={cn(
                          "-mx-1 inline-flex items-center gap-1 rounded-xs px-1 transition-colors duration-(--dur-fast) hover:text-ink-1",
                          sorted && "text-ink-1",
                          meta?.align === "right" && "flex-row-reverse",
                        )}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUp className="size-3.5 text-accent-text" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="size-3.5 text-accent-text" />
                        ) : (
                          <span className="size-3.5" />
                        )}
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const e = row.original;
            const active = e.id === selectedId || row.getIsSelected();
            return (
              <tr
                key={row.id}
                tabIndex={0}
                aria-selected={active}
                aria-label={`${e.number}, ${e.counterparty.name}`}
                onClick={() => handlers.onOpen(e)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    handlers.onOpen(e);
                  }
                  if (ev.key === " ") {
                    ev.preventDefault();
                    row.toggleSelected();
                  }
                  if (ev.key === "ArrowDown") {
                    ev.preventDefault();
                    (ev.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
                  }
                  if (ev.key === "ArrowUp") {
                    ev.preventDefault();
                    (ev.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
                  }
                }}
                className={cn(
                  "group/row cursor-pointer outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
                  "[&>td]:transition-colors [&>td]:duration-(--dur-fast) [&>td:first-child]:rounded-l-sm [&>td:last-child]:rounded-r-sm",
                  active ? "[&>td]:bg-surface-selected" : "fine:hover:[&>td]:bg-surface-hover",
                  e.id === flashId && "[&>td]:row-flash",
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as Meta | undefined;
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "h-(--row-h) px-2.5 align-middle",
                        cell.column.id !== "select" && "border-b border-line-subtle",
                        meta?.align === "right" && "text-right",
                        meta?.className,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-small text-ink-2">
        <p className="tnum">
          {from}–{to} z {total} {plural(total, "zapisu", "zapisów", "zapisów")}
        </p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <Select value={String(pagination.pageSize)} onValueChange={(v) => onPaginationChange({ pageIndex: 0, pageSize: Number(v) })}>
              <SelectTrigger size="sm" variant="button" className="w-auto gap-2" aria-label="Liczba pozycji na stronie">
                <SelectValue>{pagination.pageSize} na stronie</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className={pageBtn} aria-label="Poprzednia strona">
              <ChevronLeft className="size-4.5" />
            </button>
            <span className="tnum min-w-14 text-center text-ink-1">
              {pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
            </span>
            <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className={pageBtn} aria-label="Następna strona">
              <ChevronRight className="size-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
