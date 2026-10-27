import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/** Status pill. Only exceptions get one; healthy states are quiet text (docs §8). */
const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-pill px-2 text-small font-medium whitespace-nowrap [&>svg]:size-3.5 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "bg-surface-sunken text-ink-2",
        accent: "bg-accent-soft text-accent-soft-ink",
        ok: "bg-ok-soft text-ok-soft-ink",
        wa: "bg-wa-soft text-wa-soft-ink",
        er: "bg-er-soft text-er-soft-ink",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
)

function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
}

export { Badge, badgeVariants }
