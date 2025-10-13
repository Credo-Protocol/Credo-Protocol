/**
 * BorderBeam Component - Clean Aceternity-style implementation
 * Simple animated border beam that travels along the border
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const BorderBeam = ({
  className,
  size = 200,
  duration = 15,
  borderWidth = 1.5,
  colorFrom = "#000000",
  colorTo = "#000000",
  delay = 0,
}) => {
  return (
    <div
      style={{
        "--size": size,
        "--duration": duration,
        "--border-width": borderWidth,
        "--color-from": colorFrom,
        "--color-to": colorTo,
        "--delay": `-${delay}s`,
      }}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-[inherit]",
          "before:absolute before:inset-0 before:rounded-[inherit]",
          "before:bg-[linear-gradient(90deg,transparent_0%,var(--color-from)_50%,var(--color-to)_100%)]",
          "before:opacity-0",
          "before:[mask:linear-gradient(white,white)_content-box,linear-gradient(white,white)]",
          "before:[mask-composite:exclude]",
          "before:p-[calc(var(--border-width)*1px)]",
          "before:animate-[border-beam_var(--duration)s_linear_infinite]",
          "before:[animation-delay:var(--delay)]"
        )}
      />
    </div>
  );
};

export default BorderBeam;
