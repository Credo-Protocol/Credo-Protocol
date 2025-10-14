"use client";

import { cn } from "@/lib/utils";

/**
 * Aurora Text Component
 * Creates a beautiful aurora/gradient text effect with smooth animations
 * 
 * @param {React.ReactNode} children - The text content to apply the aurora effect to
 * @param {string} className - Additional CSS classes
 */
export function AuroraText({ children, className }) {
  return (
    <span
      className={cn(
        "inline-block bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 via-pink-500 to-purple-500 animate-aurora font-bold",
        className
      )}
    >
      {children}
    </span>
  );
}

