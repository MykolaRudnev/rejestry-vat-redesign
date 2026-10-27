"use client";
import { useState, type ReactNode } from "react";
import { Archive, Landmark, ListChecks, ReceiptText, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DemoControl } from "@/components/dev/state-switcher";
import type { Company, DemoState } from "@/lib/types";
import { AreasSheet } from "./areas-sheet";
import { Brand, BrandMark } from "./brand";
import { CompanySwitcher } from "./company-switcher";
import { Notifications, type AppNotification } from "./notifications";
import { UserMenu, outOfScope } from "./user-menu";

export type { AppNotification } from "./notifications";

/** The four areas of the original "Obszary" tabs [A10]. Only VAT is part of the prototype. */
const nav: { id: string; label: string; short: string; icon: LucideIcon }[] = [
  { id: "vat", label: "Rejestry i VAT", short: "VAT", icon: ReceiptText },
  { id: "books", label: "Księgowania", short: "Księgowania", icon: Landmark },
  { id: "assets", label: "Majątek", short: "Majątek", icon: Archive },
  { id: "checks", label: "Kontrole", short: "Kontrole", icon: ListChecks },
];

function NavItem({ item, rail }: { item: (typeof nav)[number]; rail?: boolean }) {
  const active = item.id === "vat";
  const Icon = item.icon;
  const button = (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      aria-label={rail ? item.label : undefined}
      onClick={() => !active && outOfScope()}
      className={cn(
        "flex items-center gap-2.5 rounded-md text-body transition-colors duration-(--dur-fast)",
        rail ? "size-11 justify-center" : "h-10 w-full px-2.5",
        active ? "bg-surface-selected font-medium text-ink-1" : "text-ink-2 hover:bg-surface-hover hover:text-ink-1",
      )}
    >
      <Icon className={cn("size-4.5 shrink-0", active && "text-accent-text")} strokeWidth={1.75} />
      {!rail && item.label}
    </button>
  );
  if (!rail) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function CommandButton({ onClick, rail }: { onClick: () => void; rail?: boolean }) {
  if (rail)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            aria-label="Szukaj i działaj (Ctrl+K)"
            className="grid size-11 place-items-center rounded-md text-ink-2 hover:bg-surface-hover hover:text-ink-1"
          >
            <Search className="size-4.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Szukaj i działaj · ⌘K</TooltipContent>
      </Tooltip>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Szukaj i działaj (Ctrl+K)"
      className="flex h-10 w-full items-center gap-2.5 rounded-md bg-surface-sheet px-2.5 text-body text-ink-2 shadow-sheet transition-colors duration-(--dur-fast) hover:text-ink-1"
    >
      <Search className="size-4.5 shrink-0" />
      <span className="flex-1 text-left">Szukaj i działaj</span>
      <kbd className="rounded-xs bg-surface-sunken px-1.5 font-mono text-micro text-ink-2">⌘K</kbd>
    </button>
  );
}

/**
 * Shell (docs/REDESIGN-PLAN.md §1, DS §5): the desk holds the sidebar (≥1024) or icon rail (768–1023);
 * the content sits on a paper sheet. Phones get a top bar, full-bleed sheet and a bottom nav.
 */
export function AppShell({
  company,
  companies,
  onCompanyChange,
  onOpenCommand,
  notifications,
  demoState,
  onDemoStateChange,
  topBarContext,
  areasOpen: areasOpenProp,
  onAreasOpenChange,
  children,
}: {
  company: Company;
  companies: Company[];
  onCompanyChange: (id: string) => void;
  onOpenCommand: () => void;
  notifications: AppNotification[];
  demoState: DemoState;
  onDemoStateChange: (s: DemoState) => void;
  /** Mini context shown in the phone top bar once the period hero scrolled away. */
  topBarContext?: ReactNode;
  /** "Obszary i dostępność" can also be opened from the page (e.g. "Rok wymaga konfiguracji"). */
  areasOpen?: boolean;
  onAreasOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [areasOpenState, setAreasOpenState] = useState(false);
  const areasOpen = areasOpenProp ?? areasOpenState;
  const setAreasOpen = onAreasOpenChange ?? setAreasOpenState;
  const switcher = { company, companies, onChange: onCompanyChange, onOpenAreas: () => setAreasOpen(true) };

  return (
    <div className="min-h-dvh bg-surface-desk">
      {/* Sidebar ≥1024 */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-(--sidebar-w) flex-col gap-6 px-3 pt-5 pb-3 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <div className="flex flex-col gap-2">
          <CompanySwitcher {...switcher} />
          <CommandButton onClick={onOpenCommand} />
        </div>
        <nav aria-label="Obszary" className="flex-1">
          <ul className="flex flex-col gap-0.5">
            {nav.map((item) => (
              <li key={item.id}>
                <NavItem item={item} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-0.5 border-t border-line-subtle pt-3">
          <Notifications items={notifications} variant="row" />
          <DemoControl state={demoState} onChange={onDemoStateChange} />
          <UserMenu />
        </div>
      </aside>

      {/* Icon rail 768–1023 */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-(--rail-w) flex-col items-center gap-4 pt-4 pb-3 md:flex lg:hidden">
        <BrandMark className="size-8" />
        <CompanySwitcher {...switcher} variant="icon" />
        <CommandButton onClick={onOpenCommand} rail />
        <nav aria-label="Obszary" className="flex-1">
          <ul className="flex flex-col gap-1">
            {nav.map((item) => (
              <li key={item.id}>
                <NavItem item={item} rail />
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col items-center gap-1 border-t border-line-subtle pt-3">
          <Notifications items={notifications} />
          <DemoControl state={demoState} onChange={onDemoStateChange} variant="icon" />
          <UserMenu variant="icon" />
        </div>
      </aside>

      {/* Phone top bar */}
      <header className="no-print sticky top-0 z-30 flex h-13 items-center gap-1 bg-surface-sheet pr-1 pl-2 pt-[env(safe-area-inset-top)] md:hidden">
        <div className="min-w-0 flex-1">
          {topBarContext ? (
            <div className="rise-in truncate px-2 text-title">{topBarContext}</div>
          ) : (
            <CompanySwitcher {...switcher} variant="compact" className="max-w-full" />
          )}
        </div>
        <Notifications items={notifications} />
        <UserMenu variant="icon" demo={{ state: demoState, onChange: onDemoStateChange }} onOpenCommand={onOpenCommand} />
      </header>

      <div className="md:pl-(--rail-w) lg:pl-(--sidebar-w)">
        <main className="min-h-[calc(100dvh-3.25rem)] bg-surface-sheet pb-28 md:m-(--sheet-inset) md:ml-0 md:min-h-[calc(100dvh-2*var(--sheet-inset))] md:rounded-xl md:pb-12 md:shadow-sheet">
          {children}
        </main>
      </div>

      {/* Phone bottom nav */}
      <nav
        aria-label="Obszary"
        className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 bg-surface-sheet pb-[env(safe-area-inset-bottom)] shadow-raised md:hidden"
      >
        {nav.map((item) => {
          const active = item.id === "vat";
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => !active && outOfScope()}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 text-micro font-medium",
                active ? "text-accent-text" : "text-ink-2",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2 : 1.75} />
              {item.short}
            </button>
          );
        })}
      </nav>

      <AreasSheet open={areasOpen} onOpenChange={setAreasOpen} company={company} />
    </div>
  );
}
