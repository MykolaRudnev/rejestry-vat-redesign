"use client";
import { useState } from "react";
import { AlertOctagon, Bell, CalendarDays, CircleCheck, KeyRound, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Overlay } from "@/components/ui/overlay";

export type NotificationKind = "rejected" | "confirm" | "deadline" | "session" | "done";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  /** Company · time, e.g. "Nordwind · 2 godz." */
  meta: string;
  group: "action" | "earlier";
  onClick?: () => void;
}

const icons: Record<NotificationKind, { icon: LucideIcon; className: string }> = {
  rejected: { icon: AlertOctagon, className: "text-er-soft-ink" },
  confirm: { icon: TriangleAlert, className: "text-wa-soft-ink" },
  deadline: { icon: CalendarDays, className: "text-ink-2" },
  session: { icon: KeyRound, className: "text-wa-soft-ink" },
  done: { icon: CircleCheck, className: "text-ok-soft-ink" },
};

export function CountBadge({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <span className={cn("tnum grid h-4.5 min-w-4.5 place-items-center rounded-pill bg-er-fill px-1 text-micro text-er-knockout", className)}>
      {n}
    </span>
  );
}

/** Bell → grouped list [A3]. `variant="row"` is the sidebar row, `"icon"` the top bar / rail button. */
export function Notifications({ items, variant = "icon" }: { items: AppNotification[]; variant?: "row" | "icon" }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(new Set());
  const unread = items.filter((i) => i.group === "action" && !read.has(i.id)).length;
  const label = `Powiadomienia${unread ? ` (${unread} nowe)` : ""}`;

  const trigger =
    variant === "row" ? (
      <button
        type="button"
        aria-label={label}
        className="flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-body text-ink-2 transition-colors duration-(--dur-fast) hover:bg-surface-hover hover:text-ink-1 aria-expanded:bg-surface-pressed"
      >
        <Bell className="size-4.5 shrink-0" />
        <span className="flex-1 text-left">Powiadomienia</span>
        <CountBadge n={unread} />
      </button>
    ) : (
      <button
        type="button"
        aria-label={label}
        className="relative grid size-11 place-items-center rounded-md text-ink-2 transition-colors duration-(--dur-fast) hover:bg-surface-hover hover:text-ink-1 aria-expanded:bg-surface-pressed"
      >
        <Bell className="size-5" />
        <CountBadge n={unread} className="absolute top-1.5 right-1" />
      </button>
    );

  const groups = [
    { id: "action", label: "Wymaga działania" },
    { id: "earlier", label: "Wcześniej" },
  ] as const;

  return (
    <Overlay trigger={trigger} title="Powiadomienia" open={open} onOpenChange={setOpen} side={variant === "row" ? "right" : "bottom"} align="end" className="w-95 p-1.5">
      <div className="hidden items-center justify-between px-2.5 pt-1.5 pb-1 md:flex">
        <p className="text-title">Powiadomienia</p>
        {unread > 0 && (
          <button type="button" className="rounded-xs text-small text-accent-text hover:underline hover:underline-offset-3" onClick={() => setRead(new Set(items.map((i) => i.id)))}>
            Oznacz jako przeczytane
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="max-w-[40ch] px-2.5 py-6 text-body text-ink-2">Nic nowego. Damy znać, gdy coś będzie wymagało działania.</p>
      ) : (
        groups.map((g) => {
          const list = items.filter((i) => i.group === g.id);
          if (!list.length) return null;
          return (
            <div key={g.id} className="pt-1">
              <p className="px-2.5 pt-2 pb-1 text-small font-medium text-ink-3">{g.label}</p>
              <ul>
                {list.map((n) => {
                  const { icon: Icon, className } = icons[n.kind];
                  const isUnread = n.group === "action" && !read.has(n.id);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setRead((r) => new Set(r).add(n.id));
                          setOpen(false);
                          n.onClick?.();
                        }}
                        className="flex min-h-14 w-full items-start gap-3 rounded-sm px-2.5 py-2.5 text-left transition-colors duration-(--dur-fast) hover:bg-surface-hover"
                      >
                        <Icon className={cn("mt-0.5 size-4.5 shrink-0", className)} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-body">{n.title}</span>
                          <span className="block text-small text-ink-2">{n.meta}</span>
                        </span>
                        {isUnread && <span aria-label="Nowe" className="mt-2 size-2 shrink-0 rounded-pill bg-accent-fill" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </Overlay>
  );
}
