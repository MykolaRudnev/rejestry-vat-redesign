"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon, MinusIcon } from "lucide-react"

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4.5 shrink-0 items-center justify-center rounded-xs bg-surface-raised text-accent-knockout inset-ring-2 inset-ring-line-control transition-[background-color,box-shadow] duration-(--dur-fast) after:absolute after:-inset-3 hover:inset-ring-ink-2 disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:bg-accent-fill data-[state=checked]:inset-ring-0 data-[state=indeterminate]:bg-accent-fill data-[state=indeterminate]:inset-ring-0",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center [&>svg]:size-3.5">
        {props.checked === "indeterminate" ? <MinusIcon strokeWidth={2.5} /> : <CheckIcon strokeWidth={2.5} />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
