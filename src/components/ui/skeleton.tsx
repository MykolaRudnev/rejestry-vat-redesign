import { cn } from "@/lib/utils"

/** Content-shaped placeholder; pulse and reduced motion come from the `skeleton` utility. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("skeleton", className)} {...props} />
}

export { Skeleton }
