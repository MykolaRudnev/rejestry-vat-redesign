import { cn } from "@/lib/utils";
import type { Company } from "@/lib/types";

/** Initials chip — calm, no per-company rainbow. `on` picks the chip surface for its background (DS Considerations 11). */
export function CompanyAvatar({ company, on = "sheet", className }: { company: Company; on?: "desk" | "sheet"; className?: string }) {
  const initials = company.shortName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-9 shrink-0 place-items-center rounded-md font-display text-title leading-none font-medium text-ink-1",
        on === "desk" ? "bg-surface-sheet shadow-sheet" : "bg-surface-sunken",
        className,
      )}
    >
      {initials}
    </span>
  );
}
