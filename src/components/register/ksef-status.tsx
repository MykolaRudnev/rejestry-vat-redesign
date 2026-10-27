import { AlertOctagon, Check, CircleDashed, Clock3, LoaderCircle, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ksefLabel } from "@/lib/labels";
import type { KsefState, KsefStatus } from "@/lib/types";

const look: Record<KsefStatus, { icon: LucideIcon; pill?: "accent" | "er"; text?: string; spin?: boolean }> = {
  not_sent: { icon: CircleDashed, text: "text-ink-2" },
  queued: { icon: Clock3, pill: "accent" },
  processing: { icon: LoaderCircle, pill: "accent", spin: true },
  accepted: { icon: Check, text: "text-ok-soft-ink" },
  rejected: { icon: AlertOctagon, pill: "er" },
  outside: { icon: Minus, text: "text-ink-3" },
};

/** "Only exceptions get colour" (DS §8): healthy states are quiet text, problems/in-flight are pills. */
export function KsefStatusLabel({ status, compact, className }: { status: KsefStatus; compact?: boolean; className?: string }) {
  const { icon: Icon, pill, text, spin } = look[status];
  const icon = <Icon className={cn(spin && "animate-spin motion-reduce:animate-none")} strokeWidth={1.75} />;
  if (compact)
    return (
      <span title={`KSeF: ${ksefLabel[status]}`} className={cn("inline-grid size-6 place-items-center rounded-pill [&>svg]:size-4", pill === "er" ? "bg-er-soft text-er-soft-ink" : pill ? "bg-accent-soft text-accent-soft-ink" : text, className)}>
        {icon}
        <span className="sr-only">KSeF: {ksefLabel[status]}</span>
      </span>
    );
  if (pill)
    return (
      <Badge tone={pill} className={className}>
        {icon}
        {ksefLabel[status]}
      </Badge>
    );
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-small whitespace-nowrap [&>svg]:size-4 [&>svg]:shrink-0", text, className)}>
      {icon}
      {ksefLabel[status]}
    </span>
  );
}

/** KSeF number shortened in the middle: 20261024-…-7C (full number in title / detail). */
export function shortKsef(n: string) {
  const parts = n.split("-");
  return parts.length >= 4 ? `${parts[1]}-…-${parts[parts.length - 1]}` : n;
}

/** "Numer KSeF" cell [B24]: the number, or the original's "Brak potwierdzenia" text while there is none. */
export function KsefNumber({ ksef, className }: { ksef: KsefState; className?: string }) {
  if (ksef.status === "outside") return <span className={cn("text-small text-ink-3", className)}>—</span>;
  if (!ksef.number) return <span className={cn("text-small text-ink-3", className)}>Brak potwierdzenia</span>;
  return (
    <span title={ksef.number} className={cn("block truncate font-mono text-mono text-ink-2", className)}>
      {shortKsef(ksef.number)}
    </span>
  );
}
