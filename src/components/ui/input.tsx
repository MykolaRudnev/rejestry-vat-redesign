import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * "Ledger line" field (docs §8 Inputs): sunken fill, rounded top, 1px bottom rule.
 * Error state comes from aria-invalid; read-only drops fill and rule.
 */
const fieldClass =
  "ledger w-full min-w-0 px-3 text-body text-ink-1 outline-none placeholder:text-ink-3 disabled:text-ink-disabled"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldClass, "h-11", className)} {...props} />
}

export { Input, fieldClass }
