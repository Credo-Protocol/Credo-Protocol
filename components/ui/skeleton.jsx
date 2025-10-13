/**
 * Skeleton Component - From shadcn/ui
 * A skeleton loader component for showing loading states
 */

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-black/10", className)}
      {...props}
    />
  )
}

export { Skeleton }

