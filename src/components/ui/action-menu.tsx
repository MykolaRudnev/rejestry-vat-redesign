"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"

export interface ActionItem {
  id: string
  label: string
  icon: LucideIcon
  onSelect: () => void
  shortcut?: string
  disabled?: boolean
  /** Second line shown when disabled, e.g. why. */
  hint?: string
  destructive?: boolean
  /** Hidden on phones (e.g. table-only actions). */
  desktopOnly?: boolean
}

export interface ActionGroup {
  label?: string
  items: (ActionItem | false | undefined | null)[]
}

/** A menu that becomes a bottom drawer on phones (DS §8 Menus). */
function ActionMenu({
  trigger,
  title,
  groups,
  align = "end",
  className,
  modal,
}: {
  trigger: React.ReactNode
  title: string
  groups: ActionGroup[]
  align?: "start" | "end"
  className?: string
  modal?: boolean
}) {
  const desktop = useIsDesktop()
  const [open, setOpen] = React.useState(false)
  const clean = groups
    .map((g) => ({ ...g, items: g.items.filter((i): i is ActionItem => !!i && (desktop || !i.desktopOnly)) }))
    .filter((g) => g.items.length)

  if (!desktop)
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="px-2">
            {clean.map((g, gi) => (
              <div key={gi} className={cn(gi > 0 && "pt-2")}>
                {g.label && <p className="px-2.5 pt-2 pb-1 text-small font-medium text-ink-3">{g.label}</p>}
                {g.items.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    disabled={i.disabled}
                    onClick={() => {
                      setOpen(false)
                      i.onSelect()
                    }}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-sm px-2.5 text-left text-body hover:bg-surface-hover disabled:text-ink-disabled",
                      i.destructive && !i.disabled && "text-er-soft-ink"
                    )}
                  >
                    <i.icon className={cn("size-5 shrink-0", i.disabled ? "text-ink-disabled" : i.destructive ? "text-er-soft-ink" : "text-ink-2")} strokeWidth={1.75} />
                    <span>
                      <span className="block">{i.label}</span>
                      {i.disabled && i.hint && <span className="block text-small text-ink-3">{i.hint}</span>}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    )

  return (
    <DropdownMenu modal={modal}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={className} onClick={(e) => e.stopPropagation()}>
        {clean.map((g, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <DropdownMenuSeparator />}
            {g.label && <DropdownMenuLabel>{g.label}</DropdownMenuLabel>}
            {g.items.map((i) => (
              <DropdownMenuItem key={i.id} disabled={i.disabled} variant={i.destructive && !i.disabled ? "destructive" : "default"} onSelect={i.onSelect}>
                <i.icon strokeWidth={1.75} />
                <span className="min-w-0 py-2">
                  <span className="block">{i.label}</span>
                  {i.disabled && i.hint && <span className="block text-small text-ink-3">{i.hint}</span>}
                </span>
                {i.shortcut && <DropdownMenuShortcut>{i.shortcut}</DropdownMenuShortcut>}
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ActionMenu }
