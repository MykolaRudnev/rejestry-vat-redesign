"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnOrderState, PaginationState, RowSelectionState, SortingState, VisibilityState } from "@tanstack/react-table";
import {
  CalendarCheck,
  Columns3,
  DownloadCloud,
  FileCode2,
  FileSpreadsheet,
  Plus,
  Printer,
  RotateCw,
  Search,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ActionGroup } from "@/components/ui/action-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell, type AppNotification } from "@/components/shell/app-shell";
import { EmptyState, ErrorState, LoadingState, NoResultsState } from "@/components/states/states";
import { companies, TODAY } from "@/data/companies";
import { useRegister } from "@/hooks/use-register";
import { addJpkCodes, ApiError, confirmPeriod, deleteEntry, renewKsefSession, reopenPeriod, restoreEntry, saveEntry, sendToKsef, syncFromKsef } from "@/lib/api";
import { exportCsv, exportJpk } from "@/lib/export";
import { activeFilterCount, applyFilters, totals as computeTotals } from "@/lib/filter";
import { canSendKsef, isInFlight, ksefErrors, type FixField } from "@/lib/ksef";
import { daysBetween, formatPeriod } from "@/lib/format";
import { documentsCount, monthLocative, monthNames, monthShort, plural, registerLabel, registerLongLabel } from "@/lib/labels";
import { emptyFilters, type DemoState, type EntryDraft, type Filters, type Period, type RegisterEntry, type RegisterKind } from "@/lib/types";
import { ColumnManager } from "./column-manager";
import { CommandPalette } from "./command-palette";
import { EntriesList } from "./entries-list";
import { defaultColumnOrder, defaultColumnVisibility, EntriesTable } from "./entries-table";
import { editBlock } from "./entry-actions";
import { EntryDetail, type DetailHandlers } from "./entry-detail";
import { EntryForm } from "./entry-form";
import type { SortKey } from "./filters-panel";
import { ClosePeriodSheet } from "./close-period-sheet";
import { JpkCodesSheet } from "./jpk-codes-sheet";
import { KsefTriage } from "./ksef-triage";
import { Money } from "./money";
import { AttentionLine, PeriodStatus, VatHero } from "./period-header";
import { PeriodPicker, shiftPeriod } from "./period-picker";
import { RegisterTotals } from "./register-totals";
import { bulkIcons, SelectionBar } from "./selection-bar";
import { Toolbar } from "./toolbar";

const DEMO_STATES: DemoState[] = ["filled", "empty", "error", "loading"];
const PAGE_MOBILE = 10;
const CURRENT: Period = { year: Number(TODAY.slice(0, 4)), month: Number(TODAY.slice(5, 7)) };

const sortKeyToState: Record<SortKey, SortingState> = {
  "date-desc": [{ id: "issueDate", desc: true }],
  "date-asc": [{ id: "issueDate", desc: false }],
  "gross-desc": [{ id: "gross", desc: true }],
  "gross-asc": [{ id: "gross", desc: false }],
  "name-asc": [{ id: "counterparty", desc: false }],
};
function stateToSortKey(s: SortingState): SortKey {
  const hit = (Object.keys(sortKeyToState) as SortKey[]).find(
    (k) => sortKeyToState[k][0].id === s[0]?.id && sortKeyToState[k][0].desc === s[0]?.desc,
  );
  return hit ?? "date-desc";
}
function sortEntries(list: RegisterEntry[], s: SortingState) {
  const rule = s[0];
  if (!rule) return list;
  const get = (e: RegisterEntry): string | number =>
    rule.id === "counterparty"
      ? e.counterparty.name
      : rule.id === "issueDate"
        ? e.issueDate + e.identifier
        : rule.id === "ksef"
          ? e.ksef.status
          : (e[rule.id as keyof RegisterEntry] as number | string);
  return [...list].sort((a, b) => {
    const x = get(a);
    const y = get(b);
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pl");
    return rule.desc ? -c : c;
  });
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

export function RegisterApp() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("state") as DemoState | null;
  const demoState: DemoState = raw && DEMO_STATES.includes(raw) ? raw : "filled";
  const setDemoState = useCallback(
    (s: DemoState) => {
      const p = new URLSearchParams(params.toString());
      if (s === "filled") p.delete("state");
      else p.set("state", s);
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const [companyId, setCompanyId] = useState(companies[0].id);
  const company = companies.find((c) => c.id === companyId)!;
  const [period, setPeriod] = useState<Period>(CURRENT);
  const [register, setRegister] = useState<RegisterKind>("sales");
  const [filters, setFiltersRaw] = useState<Filters>(emptyFilters);
  const [sorting, setSortingRaw] = useState<SortingState>(sortKeyToState["date-desc"]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [mobileVisible, setMobileVisible] = useState(PAGE_MOBILE);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(defaultColumnOrder);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [jpkCodesOpen, setJpkCodesOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const [detail, setDetail] = useState<RegisterEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RegisterEntry | null>(null);
  const [fix, setFix] = useState<{ field: FixField; message: string }>();
  const [triageOpen, setTriageOpen] = useState(false);
  const backToTriage = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closeStart, setCloseStart] = useState<"check" | "jpk">("check");
  const [flashId, setFlashId] = useState<string>();
  const [sendingId, setSendingId] = useState<string>();
  const [periodKey, setPeriodKey] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroHidden, setHeroHidden] = useState(false);

  const { data, status, error, refetch } = useRegister({ companyId, register, year: period.year, month: period.month, state: demoState });

  const resetView = () => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setMobileVisible(PAGE_MOBILE);
    setRowSelection({});
  };
  const setFilters = (f: Filters) => {
    setFiltersRaw(f);
    resetView();
  };
  const setSorting = (s: SortingState) => {
    setSortingRaw(s);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };
  const changePeriod = (p: Period) => {
    setPeriod(p);
    resetView();
  };
  const changeRegister = (r: RegisterKind) => {
    setRegister(r);
    setFiltersRaw((f) => ({ ...f, ksef: [], series: [] }));
    resetView();
  };
  const changeCompany = (id: string) => {
    setCompanyId(id);
    setFiltersRaw(emptyFilters);
    setDetailOpen(false);
    resetView();
    toast(`Przełączono na: ${companies.find((x) => x.id === id)!.shortName}`);
  };

  const all = useMemo(() => data?.entries ?? [], [data]);
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);
  const sortedForList = useMemo(() => sortEntries(filtered, sorting), [filtered, sorting]);
  const totals = useMemo(() => computeTotals(filtered), [filtered]);
  const isFiltered = activeFilterCount(filters) > 0 || filters.q.trim() !== "";
  const info = data?.period;
  const locked = !!info?.confirmed;
  const prev = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);
  const periodLabel = formatPeriod(period.year, period.month);
  const issues = data?.ksefIssues ?? { rejected: 0, notSent: 0 };
  const selectedIds = useMemo(() => Object.keys(rowSelection).filter((id) => all.some((e) => e.id === id)), [rowSelection, all]);
  const selectedEntries = all.filter((e) => selectedIds.includes(e.id));

  // the open detail panel always shows fresh data (falls back to the snapshot after delete)
  const shownDetail = (detail && all.find((e) => e.id === detail.id)) ?? detail;

  const openEntry = useCallback((e: RegisterEntry) => {
    setDetail(e);
    setDetailOpen(true);
  }, []);
  const openAdd = useCallback(() => {
    if (locked) {
      toast("Okres jest potwierdzony", { description: "Wybierz otwarty okres, aby dodać dokument." });
      return;
    }
    setEditing(null);
    setFix(undefined);
    setFormOpen(true);
  }, [locked]);

  /** Attention line / notifications / ⌘K → the "Do wyjaśnienia" triage sheet (sales register). */
  const showAttention = () => {
    if (register !== "sales") changeRegister("sales");
    setTriageOpen(true);
  };

  const removeWithUndo = useCallback(
    async (list: RegisterEntry[]) => {
      setDetailOpen(false);
      setRowSelection({});
      try {
        const removed = await Promise.all(list.map((e) => deleteEntry(companyId, e.id)));
        refetch(true);
        toast(list.length === 1 ? `Usunięto ${list[0].number}` : `Usunięto ${documentsCount(list.length)}`, {
          duration: 6000,
          action: {
            label: "Cofnij",
            onClick: async () => {
              await Promise.all(removed.map((r) => restoreEntry(companyId, r)));
              setFlashId(removed[0]?.id);
              refetch(true);
            },
          },
        });
      } catch (err) {
        toast.error((err as Error).message);
      }
    },
    [companyId, refetch],
  );

  /** Documents whose KSeF outcome we announce once it arrives; a batch gets one summary toast. */
  const watched = useRef<{ ids: string[]; label?: string }[]>([]);
  const sendOne = useCallback(
    async function send(e: RegisterEntry, silent = false) {
      setSendingId(e.id);
      try {
        await sendToKsef(companyId, e.id);
        if (!silent) watched.current.push({ ids: [e.id] });
        refetch(true);
      } catch {
        toast.error("Nie udało się połączyć z KSeF. Spróbuj ponownie.", { action: { label: "Ponów", onClick: () => send(e) } });
      } finally {
        setSendingId(undefined);
      }
    },
    [companyId, refetch],
  );
  const sendMany = useCallback(
    async (list: RegisterEntry[]) => {
      const targets = list.filter(canSendKsef);
      if (!targets.length) return toast("Zaznaczone dokumenty są już w KSeF");
      await Promise.all(targets.map((e) => sendToKsef(companyId, e.id)));
      watched.current.push({ ids: targets.map((e) => e.id), label: "batch" });
      toast(`Wysyłamy ${plural(targets.length, "1\u00a0fakturę", `${targets.length}\u00a0faktury`, `${targets.length}\u00a0faktur`)} do KSeF…`);
      refetch(true);
    },
    [companyId, refetch],
  );
  const renewSession = useCallback(
    async (e?: RegisterEntry) => {
      const id = toast.loading("Odnawiamy połączenie z KSeF…");
      await renewKsefSession();
      toast.success("Połączenie z KSeF odnowione", { id, description: e ? `Wysyłamy ponownie ${e.number}` : "Sesja ważna do końca dnia." });
      if (e) sendOne(e, false);
    },
    [sendOne],
  );

  const handlers: DetailHandlers = useMemo(
    () => ({
      companyId,
      locked,
      onFix: (e) => {
        const err = e.ksef.error && ksefErrors[e.ksef.error.code];
        setEditing(e);
        setFix(err?.field ? { field: err.field, message: `KSeF: ${err.title}` } : undefined);
        setDetailOpen(false);
        setFormOpen(true);
      },
      onRenewSession: (e) => renewSession(e),
      onOpen: openEntry,
      onEdit: (e) => {
        setFix(undefined);
        setEditing(e);
        setDetailOpen(false);
        setFormOpen(true);
      },
      onDelete: (e) => removeWithUndo([e]),
      onPrint: () => setTimeout(() => window.print(), 150),
      onCopy: (text, label) => {
        navigator.clipboard?.writeText(text).catch(() => {});
        toast(`${label} skopiowany`, { description: text });
      },
      onSendKsef: sendOne,
    }),
    [companyId, locked, openEntry, removeWithUndo, sendOne, renewSession],
  );

  const submitEntry = async (draft: EntryDraft) => {
    const saved = await saveEntry(companyId, draft, editing?.id);
    setFormOpen(false);
    if (fix) {
      // "Popraw dane" → saving re-sends the invoice to KSeF, then back to the triage sheet
      setFix(undefined);
      toast(`Wysłano ponownie ${saved.number}`);
      await sendOne(saved);
      if (backToTriage.current) {
        backToTriage.current = false;
        setTriageOpen(true);
      }
      return;
    }
    const target: Period = { year: Number(saved.issueDate.slice(0, 4)), month: Number(saved.issueDate.slice(5, 7)) };
    const samePlace = saved.register === register && target.year === period.year && target.month === period.month;
    refetch(true);
    if (samePlace) {
      setFlashId(saved.id);
      toast.success(editing ? "Zapisano zmiany" : "Dodano do rejestru", {
        description: `${saved.number} · ${saved.counterparty.name}`,
        action: saved.register === "sales" && !editing ? { label: "Wyślij do KSeF", onClick: () => sendOne(saved) } : undefined,
      });
    } else {
      toast.success(editing ? "Zapisano zmiany" : "Dodano do rejestru", {
        description: `${registerLongLabel[saved.register]} · ${formatPeriod(target.year, target.month)}`,
        action: {
          label: "Pokaż",
          onClick: () => {
            setRegister(saved.register);
            setPeriod(target);
            setFlashId(saved.id);
          },
        },
      });
    }
  };

  const doConfirm = async () => {
    await confirmPeriod(companyId, period.year, period.month);
    setPeriodKey((k) => k + 1);
    refetch(true);
    toast.success(`${periodLabel} – okres potwierdzony`, { description: `JPK_${company.vatScheme} jest gotowy do wysyłki.` });
  };
  const doReopen = async () => {
    try {
      await reopenPeriod(companyId, period.year, period.month);
      setPeriodKey((k) => k + 1);
      refetch(true);
      toast(`${periodLabel} – okres otwarty ponownie`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const openClose = (start: "check" | "jpk") => {
    setCloseStart(start);
    setConfirmOpen(true);
  };

  const doExport = (list: RegisterEntry[] = sortedForList) => {
    if (!list.length) return toast("Brak danych do eksportu");
    exportCsv(list, company, register, period.year, period.month);
    toast.success("Wyeksportowano CSV", { description: documentsCount(list.length) });
  };
  const doSync = () =>
    toast.promise(syncFromKsef(), {
      loading: "Synchronizacja z KSeF…",
      success: (n) => (n ? `Pobrano ${documentsCount(n)}` : "Wszystko aktualne – brak nowych faktur w KSeF"),
      error: "KSeF nie odpowiada",
    });
  const doRefresh = () => refetch(false);
  const doPrint = () => setTimeout(() => window.print(), 150);

  const startTagging = () => {
    if (selectedIds.length) setJpkCodesOpen(true);
    else toast("Zaznacz dokumenty, które chcesz oznaczyć", { description: "Kliknij pole wyboru przy wierszu (na telefonie: przytrzymaj wiersz)." });
  };
  const applyJpkCodes = async (codes: string[]) => {
    const n = await addJpkCodes(companyId, selectedIds, codes);
    refetch(true);
    setRowSelection({});
    toast.success(`Oznaczono ${documentsCount(n)}`, { description: codes.join(", ") });
  };
  const bulkSend = () => {
    const list = selectedEntries;
    setRowSelection({});
    sendMany(list);
  };

  // KSeF: poll while anything is in flight, then announce outcomes
  const inFlight = all.some((e) => isInFlight(e.ksef.status));
  useEffect(() => {
    if (!inFlight) return;
    const t = setInterval(() => refetch(true), 1200);
    return () => clearInterval(t);
  }, [inFlight, refetch]);
  useEffect(() => {
    if (!all.length) return;
    watched.current = watched.current.filter((w) => {
      const list = w.ids.map((id) => all.find((e) => e.id === id)).filter((e): e is RegisterEntry => !!e);
      // documents off screen (other tab / period) or still in flight: keep waiting
      if (list.length < w.ids.length || list.some((e) => isInFlight(e.ksef.status))) return true;
      const bad = list.filter((e) => e.ksef.status !== "accepted");
      if (w.label === "batch") {
        const sent = `Wysłano ${plural(list.length, "1\u00a0fakturę", `${list.length}\u00a0faktury`, `${list.length}\u00a0faktur`)} do KSeF.`;
        if (bad.length) toast(`${sent} ${bad.length}\u00a0${plural(bad.length, "wymaga", "wymagają", "wymaga")} uwagi.`, { action: { label: "Pokaż", onClick: () => setTriageOpen(true) } });
        else toast.success(sent);
      } else if (list[0]) {
        const e = list[0];
        if (e.ksef.status === "accepted") toast.success(`${e.number} przyjęta w KSeF`, { description: e.ksef.number });
        else if (e.ksef.error)
          toast.error(`${e.number}: ${ksefErrors[e.ksef.error.code].title}`, { action: { label: "Wyjaśnij", onClick: () => setTriageOpen(true) } });
      }
      return false;
    });
  }, [all]);

  // phone: once the hero scrolls away, the top bar shows the period + VAT due
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeroHidden(!e.isIntersecting), { rootMargin: "-52px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [status]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector("[role=dialog]")) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        openAdd();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openAdd]);

  const notifications: AppNotification[] = [];
  const prevMonth = period.month === 1 ? 12 : period.month - 1;
  if (issues.rejected)
    notifications.push({
      id: "ksef-rejected",
      kind: "rejected",
      group: "action",
      title: `${issues.rejected} ${plural(issues.rejected, "faktura odrzucona", "faktury odrzucone", "faktur odrzuconych")} w KSeF`,
      meta: `${company.shortName} · dziś`,
      onClick: showAttention,
    });
  if (info && !info.confirmed && info.jpkStatus === "due") {
    notifications.push({
      id: "confirm",
      kind: "confirm",
      group: "action",
      title: `${monthNames[period.month - 1][0].toUpperCase()}${monthNames[period.month - 1].slice(1)} wymaga potwierdzenia`,
      meta: company.shortName,
      onClick: () => openClose("check"),
    });
    notifications.push({
      id: "jpk",
      kind: "deadline",
      group: "action",
      title: `JPK_${company.vatScheme} za ${monthNames[period.month - 1]} do ${Number(info.jpkDeadline.slice(8))}.${info.jpkDeadline.slice(5, 7)}`,
      meta: `${company.shortName} · za ${daysBetween(TODAY, info.jpkDeadline)} dni`,
      onClick: () => openClose("check"),
    });
  }
  notifications.push(
    { id: "session", kind: "session", group: "action", title: "Sesja KSeF wygasa za 2 dni", meta: `${company.shortName} · Odnów połączenie`, onClick: () => renewSession() },
    { id: "jpk-prev", kind: "done", group: "earlier", title: `JPK_${company.vatScheme} za ${monthNames[prevMonth - 1]} wysłany · UPO`, meta: company.shortName },
  );

  /** ⋯ menu [B9 B10 B11 B26] — everything secondary lives here (and in ⌘K). */
  const menu: ActionGroup[] = [
    {
      items: [
        !locked && info?.jpkStatus === "due" && { id: "close", label: "Zamknij okres", icon: CalendarCheck, onSelect: () => openClose("check") },
        { id: "tag", label: "Oznacz kodami JPK…", icon: Tag, disabled: locked, hint: locked ? "Okres jest potwierdzony" : undefined, onSelect: startTagging },
      ],
    },
    {
      label: "Rejestr",
      items: [
        { id: "jpk-preview", label: `Podgląd JPK_${company.vatScheme}`, icon: FileCode2, disabled: !data, onSelect: () => openClose("jpk") },
        { id: "print", label: "Drukuj rejestr", icon: Printer, onSelect: doPrint },
        { id: "csv", label: "Eksportuj do CSV", icon: FileSpreadsheet, onSelect: () => doExport() },
        { id: "columns", label: "Kolumny", icon: Columns3, desktopOnly: true, onSelect: () => setColumnsOpen(true) },
      ],
    },
    {
      label: "Dane",
      items: [
        { id: "sync", label: "Synchronizuj z KSeF", icon: DownloadCloud, onSelect: doSync },
        { id: "refresh", label: "Odśwież dane", icon: RotateCw, onSelect: doRefresh },
        { id: "palette", label: "Szukaj i działaj", icon: Search, shortcut: "⌘K", desktopOnly: true, onSelect: () => setPaletteOpen(true) },
      ],
    },
  ];

  const counts = data?.counts;
  let content: React.ReactNode;
  if (status === "loading") content = <LoadingState />;
  else if (status === "error")
    content = <ErrorState code={error instanceof ApiError ? error.code : undefined} onRetry={() => setDemoState("filled")} />;
  else if (data && all.length === 0)
    content = (
      <EmptyState
        monthLocative={monthLocative[period.month - 1]}
        registerLocative={register === "sales" ? "rejestrze VAT sprzedaży" : "rejestrze VAT zakupów"}
        future={info?.jpkStatus === "future"}
        onAdd={openAdd}
        onBack={prev ? () => changePeriod(info?.jpkStatus === "future" ? CURRENT : prev) : undefined}
        backLabel={info?.jpkStatus === "future" ? "Wróć do bieżącego miesiąca" : prev ? `Pokaż ${formatPeriod(prev.year, prev.month).toLowerCase()}` : undefined}
        locked={locked}
      />
    );
  else if (data)
    content = (
      <div className="flex flex-col gap-2">
        <Toolbar
          ref={searchRef}
          filters={filters}
          onChange={setFilters}
          entries={all}
          sort={stateToSortKey(sorting)}
          onSortChange={(k) => setSorting(sortKeyToState[k])}
          resultLabel={isFiltered ? `${filtered.length} z ${all.length} ${plural(all.length, "dokumentu", "dokumentów", "dokumentów")}` : documentsCount(all.length)}
          menu={menu}
          onAdd={openAdd}
          locked={locked}
        />
        {filtered.length === 0 ? (
          <NoResultsState query={filters.q.trim()} total={all.length} onClear={() => setFilters(emptyFilters)} />
        ) : (
          <>
            <div className="hidden md:block">
              <EntriesTable
                entries={filtered}
                handlers={handlers}
                selectedId={detailOpen ? detail?.id : undefined}
                flashId={flashId}
                sorting={sorting}
                onSortingChange={setSorting}
                pagination={pagination}
                onPaginationChange={setPagination}
                columnVisibility={columnVisibility}
                columnOrder={columnOrder}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            </div>
            <div className="md:hidden">
              <EntriesList
                entries={sortedForList}
                onOpen={openEntry}
                groupByDay={sorting[0]?.id === "issueDate"}
                visible={mobileVisible}
                onMore={() => setMobileVisible((v) => v + PAGE_MOBILE)}
                flashId={flashId}
                selected={new Set(selectedIds)}
                onToggle={(id) =>
                  setRowSelection((s) => {
                    const n = { ...s };
                    if (n[id]) delete n[id];
                    else n[id] = true;
                    return n;
                  })
                }
              />
            </div>
          </>
        )}
      </div>
    );

  return (
    <AppShell
      company={company}
      companies={companies}
      onCompanyChange={changeCompany}
      onOpenCommand={() => setPaletteOpen(true)}
      notifications={notifications}
      demoState={demoState}
      onDemoStateChange={setDemoState}
      areasOpen={areasOpen}
      onAreasOpenChange={setAreasOpen}
      topBarContext={
        heroHidden && data && status === "success" ? (
          <span className="tnum">
            {monthShort[period.month - 1][0].toUpperCase() + monthShort[period.month - 1].slice(1)} {period.year} ·{" "}
            <Money value={Math.abs(data.vatDue.output - data.vatDue.input)} variant="inline" />
          </span>
        ) : undefined
      }
    >
      <div
        className={cn(
          "w-full px-(--gutter) pt-3 pb-[calc(3.5rem+1rem)] md:pt-10 md:pb-0",
          selectedIds.length > 0 && "md:pb-24",
        )}
      >
        <header className="flex flex-col gap-2 md:gap-3">
          <div className="flex items-start justify-between gap-6 max-md:hidden">
            <div className="min-w-0">
              <p className="mb-1.5 truncate text-small text-ink-2">{company.name}</p>
              <h1 className="font-display text-display-1">Rejestry i VAT</h1>
            </div>
            <PeriodPicker
              companyId={companyId}
              period={period}
              onChange={changePeriod}
              refreshKey={periodKey}
              jpkUnavailable={status === "error"}
              onConfigureYear={() => setAreasOpen(true)}
            />
          </div>
          <div className="md:hidden">
            <PeriodPicker
              size="phone"
              companyId={companyId}
              period={period}
              onChange={changePeriod}
              refreshKey={periodKey}
              jpkUnavailable={status === "error"}
              onConfigureYear={() => setAreasOpen(true)}
            />
            <h1 className="truncate text-small text-ink-2">Rejestry i VAT</h1>
          </div>
          {info && <PeriodStatus info={info} scheme={company.vatScheme} onClosePeriod={() => openClose(info?.confirmed ? "jpk" : "check")} />}
        </header>

        {/* ≥1280: the attention line sits beside the hero instead of leaving the right half empty */}
        <div className="mt-(--stack-section) flex flex-col gap-(--stack-group) xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] xl:items-end xl:gap-x-12">
          <VatHero
            ref={heroRef}
            periodKey={`${companyId}-${period.year}-${period.month}`}
            vatDue={data?.vatDue}
            state={status === "error" ? "error" : status === "loading" || !data ? "loading" : "ready"}
          />
          {data && status === "success" && <AttentionLine rejected={issues.rejected} notSent={issues.notSent} onOpen={showAttention} />}
        </div>

        <Tabs value={register} onValueChange={(v) => changeRegister(v as RegisterKind)} className="mt-(--stack-section)">
          <TabsList aria-label="Rejestr">
            {(["sales", "purchase"] as RegisterKind[]).map((r) => (
              <TabsTrigger key={r} value={r} title={registerLongLabel[r]} aria-label={registerLongLabel[r]}>
                {registerLabel[r]}
                {counts && status === "success" && <span className="tnum text-small font-normal text-ink-3">{counts[r]}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={register} className="mt-(--stack-group) flex flex-col gap-(--stack-group)">
            {status !== "error" && (status !== "success" || all.length > 0) && (
              <RegisterTotals totals={status === "success" ? totals : undefined} filtered={isFiltered} loading={status !== "success"} />
            )}
            <div key={`${companyId}-${register}-${period.year}-${period.month}-${demoState}`}>{content}</div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Phone primary action */}
      {!locked && status === "success" && all.length > 0 && selectedIds.length === 0 && (
        <button
          type="button"
          onClick={openAdd}
          className="no-print fixed right-4 bottom-[calc(3.5rem+1rem+env(safe-area-inset-bottom))] z-30 flex h-14 items-center gap-2 rounded-pill bg-accent-fill pr-6 pl-5 text-body font-medium text-accent-knockout shadow-fab transition-transform duration-(--dur-press) active:scale-[.98] md:hidden"
        >
          <Plus className="size-5" /> Dodaj
        </button>
      )}

      <SelectionBar
        count={formOpen || jpkCodesOpen || columnsOpen || paletteOpen || triageOpen ? 0 : selectedIds.length}
        onClear={() => setRowSelection({})}
        actions={[
          ...(register === "sales"
            ? [{ id: "send", label: "Wyślij do KSeF", icon: bulkIcons.send, disabled: locked || !selectedEntries.some(canSendKsef), onSelect: bulkSend }]
            : []),
          { id: "tag", label: "Oznacz kodami JPK", icon: bulkIcons.tag, disabled: locked, onSelect: startTagging },
          { id: "export", label: "Eksportuj", icon: bulkIcons.export, onSelect: () => doExport(selectedEntries) },
          { id: "print", label: "Drukuj", icon: bulkIcons.print, onSelect: doPrint },
          {
            id: "delete",
            label: "Usuń",
            icon: bulkIcons.delete,
            destructive: true,
            disabled: selectedEntries.some((e) => !!editBlock(e, locked)),
            onSelect: () => removeWithUndo(selectedEntries),
          },
        ]}
      />

      <EntryDetail
        entry={shownDetail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        handlers={handlers}
        sending={!!detail && sendingId === detail.id}
        siblings={sortedForList}
        onNavigate={openEntry}
      />
      <EntryForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setFix(undefined);
        }}
        entry={editing}
        register={register}
        period={period}
        today={TODAY}
        onSubmit={submitEntry}
        fix={fix}
        onOpenExisting={(id) => {
          const ex = all.find((x) => x.id === id);
          setFormOpen(false);
          if (ex) openEntry(ex);
        }}
      />
      <ColumnManager
        open={columnsOpen}
        onOpenChange={setColumnsOpen}
        order={columnOrder}
        visibility={columnVisibility}
        onChange={(o, v) => {
          setColumnOrder(o);
          setColumnVisibility(v);
        }}
      />
      <KsefTriage
        open={triageOpen}
        onOpenChange={setTriageOpen}
        entries={status === "success" ? all.filter((e) => e.register === "sales") : []}
        handlers={{
          onFix: (e) => {
            backToTriage.current = true;
            setTriageOpen(false);
            handlers.onFix(e);
          },
          onSend: (e) => sendOne(e, true),
          onSendAll: (list) => sendMany(list),
          onRenew: (e) => renewSession(e),
          onOpenEntry: (e) => {
            setTriageOpen(false);
            openEntry(e);
          },
        }}
      />
      <JpkCodesSheet open={jpkCodesOpen} onOpenChange={setJpkCodesOpen} count={selectedIds.length} onApply={applyJpkCodes} />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        entries={all}
        companies={companies}
        companyId={companyId}
        register={register}
        locked={locked}
        actions={{
          add: openAdd,
          confirmPeriod: !locked && info?.jpkStatus === "due" ? () => openClose("check") : undefined,
          exportCsv: () => doExport(),
          print: doPrint,
          jpk: () => openClose("jpk"),
          sync: doSync,
          refresh: doRefresh,
          switchRegister: changeRegister,
          prevPeriod: prev ? () => changePeriod(prev) : undefined,
          nextPeriod: next ? () => changePeriod(next) : undefined,
          showAttention: issues.rejected + issues.notSent ? showAttention : undefined,
          openEntry,
          switchCompany: changeCompany,
        }}
      />

      {info && data && (
        <ClosePeriodSheet
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          start={info.confirmed ? "jpk" : closeStart}
          company={company}
          info={info}
          counts={data.counts}
          vatDue={data.vatDue}
          issues={issues}
          inFlight={register === "sales" ? all.filter((e) => isInFlight(e.ksef.status)).length : 0}
          demoState={demoState}
          onExplain={() => {
            setConfirmOpen(false);
            showAttention();
          }}
          onConfirm={doConfirm}
          onReopen={doReopen}
          onExport={(fields) => {
            exportJpk(company, period.year, period.month, fields);
            toast.success(`Pobrano JPK_${company.vatScheme} (XML)`, { description: "Wersja poglądowa, nie do wysyłki." });
          }}
        />
      )}
    </AppShell>
  );
}

