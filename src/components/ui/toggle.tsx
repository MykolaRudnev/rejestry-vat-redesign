"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Toggle as TogglePrimitive } from "radix-ui"

/** Toggle chip (docs §8 Chips): off = sunken, on = accent fill. */
const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-[background-color,color] duration-(--dur-fast) disabled:cursor-not-allowed disabled:text-ink-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        chip: "h-8 rounded-pill bg-surface-sunken px-3 text-small text-ink-1 touch:h-9 hover:bg-surface-pressed data-[state=on]:bg-accent-fill data-[state=on]:text-accent-knockout",
        ghost: "size-(--control-h) rounded-md text-ink-2 hover:bg-surface-hover hover:text-ink-1 data-[state=on]:bg-surface-pressed data-[state=on]:text-ink-1",
      },
    },
    defaultVariants: { variant: "chip" },
  }
)

function Toggle({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return <TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants({ variant }), className)} {...props} />
}

export { Toggle, toggleVariants }
