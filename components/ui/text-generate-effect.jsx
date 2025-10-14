"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Text Generate Effect Component
 * Animates text by revealing words one at a time with a blur effect
 * 
 * @param {string} words - The text to animate
 * @param {string} className - Additional CSS classes
 * @param {boolean} filter - Whether to apply blur filter (default: true)
 * @param {number} duration - Animation duration per word (default: 0.5)
 */
export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}) => {
  const [scope, animate] = useAnimate();
  let wordsArray = words.split(" ");
  
  useEffect(() => {
    // Animate each word (span) to fade in and remove blur
    animate(
      "span",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      {
        duration: duration ? duration : 1,
        delay: stagger(0.2), // Stagger each word by 0.2s
      }
    );
  }, [scope.current]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className="dark:text-white text-black opacity-0"
              style={{
                filter: filter ? "blur(10px)" : "none",
              }}
            >
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn("font-bold dark:text-white text-black leading-tight tracking-tight", className)}>
      {renderWords()}
    </div>
  );
};

