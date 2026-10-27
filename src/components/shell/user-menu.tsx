"use client";
import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Keyboard, LogOut, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Overlay } from "@/components/ui/overlay";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DemoStateList } from "@/components/dev/state-switcher";
import type { DemoState } from "@/lib/types";

export const USER = { name: "Preview Reviewer", initials: "PR" };

export const outOfScope = () =>
  toast("Poza prototypem", { description: "Przeprojektowaliśmy tylko ekran „Rejestry i VAT”." });

const showShortcuts = () =>
  toast("Skróty klawiszowe", {
    description: "⌘K szukaj i działaj · / szukaj w rejestrze · N nowy dokument · ↑↓ Enter wiersze · Esc zamknij",
    duration: 8000,
  });

function UserAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("grid size-8 shrink-0 place-items-center rounded-pill bg-surface-inverse text-micro text-ink-inverse", className)}
    >
      {USER.initials}
    </span>
  );
}

function Item({ icon: Icon, children, onClick }: { icon: LucideIcon; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-10 w-full items-center gap-2.5 rounded-sm px-2.5 text-body transition-colors duration-(--dur-fast) touch:min-h-12 hover:bg-surface-hover"
    >
      <Icon className="size-4.5 shrink-0 text-ink-2" />
      {children}
    </button>
  );
}

/** Account menu [A1 A2 A4]. On phones it also carries ⌘K and the demo control. */
export function UserMenu({
  variant = "row",
  demo,
  onOpenCommand,
}: {
  variant?: "row" | "icon";
  demo?: { state: DemoState; onChange: (s: DemoState) => void };
  onOpenCommand?: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const trigger =
    variant === "row" ? (
      <button
        type="button"
        aria-label={`Konto: ${USER.name}`}
        className="flex h-12 w-full min-w-0 items-center gap-2.5 rounded-md px-2 text-left transition-colors duration-(--dur-fast) hover:bg-surface-hover aria-expanded:bg-surface-pressed"
      >
        <UserAvatar />
        <span className="min-w-0">
          <span className="block truncate text-body font-medium">{USER.name}</span>
          <span className="block truncate text-small text-ink-2">Konto użytkownika</span>
        </span>
      </button>
    ) : (
      <button type="button" aria-label={`Konto: ${USER.name}`} className="grid size-11 place-items-center rounded-pill hover:bg-surface-hover aria-expanded:bg-surface-pressed">
        <UserAvatar />
      </button>
    );

  return (
    <Overlay trigger={trigger} title={`Witaj, ${USER.name}!`} open={open} onOpenChange={setOpen} side={variant === "row" ? "right" : "bottom"} align="end" className="w-75 p-1.5">
      <div className="hidden flex-col gap-0.5 px-2.5 pt-2 pb-3 md:flex">
        <p className="text-title">Witaj, {USER.name}!</p>
        <p className="text-small text-ink-2">Konto użytkownika</p>
      </div>
      <div className="flex items-center justify-between gap-3 px-2.5 pb-2">
        <span className="text-body">Motyw</span>
        <ToggleGroup type="single" value={theme ?? "light"} onValueChange={(v) => v && setTheme(v)} aria-label="Motyw">
          <ToggleGroupItem value="light">Jasny</ToggleGroupItem>
          <ToggleGroupItem value="dark">Ciemny</ToggleGroupItem>
          <ToggleGroupItem value="system">System</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {onOpenCommand && (
        <Item icon={Search} onClick={run(onOpenCommand)}>
          Szukaj i działaj
        </Item>
      )}
      <Item icon={Keyboard} onClick={run(showShortcuts)}>
        <span className="flex-1 text-left">Skróty klawiszowe</span>
        <kbd className="hidden rounded-xs bg-surface-sunken px-1.5 font-mono text-micro text-ink-2 fine:inline">?</kbd>
      </Item>
      <Item icon={LogOut} onClick={run(outOfScope)}>
        Wyloguj
      </Item>
      {demo && (
        <div className="mt-2 pt-2">
          <p className="px-2.5 pb-1 text-small font-medium text-ink-3">Dane demonstracyjne</p>
          <DemoStateList state={demo.state} onChange={(s) => { setOpen(false); demo.onChange(s); }} />
        </div>
      )}
    </Overlay>
  );
}
