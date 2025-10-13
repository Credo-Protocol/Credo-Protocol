/**
 * AnimatedBorder Component
 * Rotating conic gradient border animation
 */

"use client";

import { cn } from "@/lib/utils";

export function AnimatedBorder({
  children,
  className,
  borderWidth = 2,
  borderRadius = 16,
  duration = 4,
}) {
  return (
    <div
      className={cn("relative", className)}
      style={{
        borderRadius: `${borderRadius}px`,
      }}
    >
      {/* Animated rotating gradient border */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          borderRadius: `${borderRadius}px`,
          padding: `${borderWidth}px`,
          background: `conic-gradient(from 0deg, transparent 0%, #000000 25%, transparent 50%, #000000 75%, transparent 100%)`,
          animation: `spin ${duration}s linear infinite`,
        }}
      >
        {/* Inner white background to create border effect */}
        <div
          className="h-full w-full bg-white"
          style={{
            borderRadius: `${borderRadius - borderWidth}px`,
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default AnimatedBorder;

