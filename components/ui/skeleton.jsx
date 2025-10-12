/**
 * Skeleton Component
 * 
 * Loading placeholder component for content that's being loaded.
 * Provides a better user experience during async operations.
 */

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }

