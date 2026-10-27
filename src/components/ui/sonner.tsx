"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleAlert, LoaderCircle } from "lucide-react"

/** Inverse toast (docs/design-system.md §8 Toasts): silent success, alert icon on error. */
const Toaster = (props: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      position="bottom-right"
      offset={{ right: 24, bottom: 72 }}
      mobileOffset={{ bottom: 76, left: 12, right: 12 }}
      visibleToasts={2}
      icons={{
        success: null,
        info: null,
        error: <CircleAlert className="size-4.5 text-er-on-inverse" strokeWidth={1.75} />,
        warning: <CircleAlert className="size-4.5 text-er-on-inverse" strokeWidth={1.75} />,
        loading: <LoaderCircle className="size-4.5 animate-spin" strokeWidth={1.75} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full max-w-105 items-center gap-3 rounded-md bg-surface-inverse px-4 py-3 text-body text-ink-inverse shadow-overlay",
          title: "font-medium",
          description: "text-small opacity-80",
          actionButton:
            "focus-knockout ml-auto shrink-0 rounded-sm px-1 font-medium text-accent-on-inverse hover:underline hover:underline-offset-3",
          cancelButton: "focus-knockout shrink-0 rounded-sm px-1 text-ink-inverse opacity-80 hover:opacity-100",
          closeButton: "focus-knockout",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
