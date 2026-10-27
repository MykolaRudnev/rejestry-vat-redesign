"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsDesktop } from "@/hooks/use-media-query"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"

/**
 * Popover on ≥768, bottom drawer below (docs §8: "on phones every menu becomes a bottom drawer").
 * The title is visible in the drawer and screen-reader-only in the popover unless `showTitle`.
 */
function Overlay({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  align = "start",
  side = "bottom",
  showTitle = false,
  className,
}: {
  trigger: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  showTitle?: boolean
  className?: string
}) {
  const desktop = useIsDesktop()
  if (!desktop) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <DrawerBody className="px-2">{children}</DrawerBody>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} side={side} aria-label={title} className={cn("w-80", className)}>
        {showTitle ? (
          <div className="flex flex-col gap-0.5 px-2.5 pt-2 pb-1.5">
            <p className="text-title">{title}</p>
            {description && <p className="text-small text-ink-2">{description}</p>}
          </div>
        ) : null}
        {children}
      </PopoverContent>
    </Popover>
  )
}

export { Overlay }
