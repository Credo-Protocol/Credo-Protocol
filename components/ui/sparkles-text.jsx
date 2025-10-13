/**
 * SparklesText Component
 * Dynamic text with animated sparkles
 */

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function SparklesText({
  text,
  className,
  sparklesCount = 10,
  colors = {
    first: "#3B82F6",
    second: "#7C3AED",
  },
}) {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const generateSparkle = () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: Math.random() > 0.5 ? colors.first : colors.second,
      delay: Math.random() * 2,
      scale: Math.random() * 0.5 + 0.5,
      lifespan: Math.random() * 1000 + 1500,
    });

    const interval = setInterval(() => {
      const newSparkle = generateSparkle();
      setSparkles((prev) => [...prev, newSparkle]);

      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
      }, newSparkle.lifespan);
    }, 300);

    return () => clearInterval(interval);
  }, [colors]);

  return (
    <div className={cn("relative inline-block", className)}>
      <span className="relative z-10">{text}</span>
      <span className="absolute inset-0">
        {sparkles.map((sparkle) => (
          <span
            key={sparkle.id}
            className="absolute animate-sparkle"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              animationDelay: `${sparkle.delay}s`,
              transform: `scale(${sparkle.scale})`,
            }}
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.6915 4.97503 13.2951 5.57866C13.8988 6.18229 14.6815 6.47323 16.1535 7.01204L18.0299 7.69926C18.6586 7.92933 18.6586 8.81866 18.0299 9.04873L16.1535 9.73595C14.6815 10.2748 13.8988 10.5657 13.2951 11.1693C12.6915 11.773 12.4006 12.5557 11.8618 14.0277L11.1746 15.9041C10.9446 16.5328 10.0553 16.5328 9.82531 15.9041L9.13809 14.0277C8.59928 12.5557 8.30834 11.773 7.70471 11.1693C7.10108 10.5657 6.31834 10.2748 4.84631 9.73595L2.97 9.04873C2.34133 8.81866 2.34133 7.92933 2.97 7.69926L4.84631 7.01204C6.31834 6.47323 7.10108 6.18229 7.70471 5.57866C8.30834 4.97503 8.59928 4.19229 9.13809 2.72026L9.82531 0.843845Z"
                fill={sparkle.color}
              />
            </svg>
          </span>
        ))}
      </span>
    </div>
  );
}

export default SparklesText;

