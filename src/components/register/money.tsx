import { cn } from "@/lib/utils";
import { formatMoney, splitMoney } from "@/lib/format";

type Variant = "hero" | "display" | "table" | "inline";

/**
 * Amount set as typography (docs §8 Amount formatting).
 * Thousands groups are spaced with margin (thin spaces collapse in our faces); screen readers get the full value via sr-only text.
 * hero/display: decimals and "zł" shrink (floored at --money-minor-min) and fade; table: same-size decimals, no "zł".
 */
export function Money({ value, variant = "table", className }: { value: number; variant?: Variant; className?: string }) {
  const { sign, int, dec } = splitMoney(value);
  const groups = int.split(" ");
  const zero = value === 0;
  const display = variant === "hero" || variant === "display";
  const minor = variant === "hero" ? "money-minor-hero" : variant === "display" ? "money-minor-display" : undefined;
  const unit = variant === "hero" ? "money-unit-hero" : "money-unit-display";

  return (
    <span
      role="text"
      aria-label={formatMoney(value).replace("-", "−")}
      className={cn(display ? "pnum" : "tnum", "whitespace-nowrap", zero ? "text-ink-3" : variant !== "inline" && "text-ink-1", className)}
    >
      <span className="sr-only">{formatMoney(value).replace("-", "\u2212")}</span>
      <span aria-hidden>
        {sign}
        {groups.map((g, i) => (
          <span key={i} className={i > 0 ? "money-group" : undefined}>
            {g}
          </span>
        ))}
        <span className={cn(variant !== "inline" && "text-ink-3", minor)}>,{dec}</span>
        {(display || variant === "inline") && (
          <span className={cn(display ? cn(unit, "font-sans font-normal text-ink-3") : "money-group")}>zł</span>
        )}
      </span>
    </span>
  );
}
