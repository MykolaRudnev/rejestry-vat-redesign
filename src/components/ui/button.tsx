import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"
import { LoaderCircle } from "lucide-react"

/** Button hierarchy (docs §8): one primary per view; secondary, ghost, text, danger. */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap select-none transition-[background-color,color,transform] duration-(--dur-fast) ease-out disabled:cursor-not-allowed aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-fill text-accent-knockout hover:bg-accent-fill-hover active:scale-[.98] active:bg-accent-fill-active active:duration-(--dur-press) disabled:bg-surface-sunken disabled:text-ink-disabled disabled:active:scale-100",
        secondary:
          "bg-surface-sunken text-ink-1 hover:bg-surface-pressed active:bg-surface-pressed aria-expanded:bg-surface-pressed disabled:text-ink-disabled disabled:hover:bg-surface-sunken",
        ghost:
          "text-ink-2 hover:bg-surface-hover hover:text-ink-1 active:bg-surface-pressed aria-expanded:bg-surface-pressed aria-expanded:text-ink-1 disabled:text-ink-disabled disabled:hover:bg-transparent",
        text: "rounded-xs! px-0! h-auto! text-accent-text underline-offset-3 hover:underline active:text-accent-fill-active disabled:text-ink-disabled disabled:no-underline",
        danger: "bg-er-fill text-er-knockout hover:bg-er-fill-hover",
        "danger-ghost": "text-er-soft-ink hover:bg-er-soft",
      },
      size: {
        md: "h-(--control-h) rounded-md px-4 text-body",
        sm: "h-8 rounded-sm px-3 text-small touch:h-11",
        icon: "size-(--control-h) rounded-md",
        "icon-sm": "size-8 rounded-sm touch:size-11",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && !asChild ? (
        <>
          <LoaderCircle className="animate-spin" />
          {React.Children.toArray(children).filter((c) => typeof c === "string")}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
