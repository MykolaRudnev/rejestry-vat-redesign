"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

/** Segmented control (docs §8): theme, sort, page size. Sunken track, raised selected segment. */
function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("inline-flex w-fit items-center gap-0.5 rounded-md bg-surface-sunken p-0.5", className)}
      {...props}
    />
  )
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-sm px-3 text-small font-medium whitespace-nowrap text-ink-2 transition-[background-color,color] duration-(--dur-fast) touch:h-10 hover:text-ink-1 disabled:text-ink-disabled data-[state=on]:bg-surface-raised data-[state=on]:text-ink-1 data-[state=on]:shadow-raised [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
