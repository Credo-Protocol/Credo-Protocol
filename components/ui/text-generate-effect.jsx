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
 * @param {boolean} auroraLastWord - Whether to apply aurora effect to last word (default: false)
 */
export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  auroraLastWord = false,
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
          // Check if this is the last word and aurora effect should be applied
          const isLastWord = idx === wordsArray.length - 1;
          const shouldApplyAurora = auroraLastWord && isLastWord;
          
          return (
            <motion.span
              key={word + idx}
              className={cn(
                "opacity-0",
                shouldApplyAurora 
                  ? "bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 via-pink-500 to-purple-500 animate-aurora" 
                  : "dark:text-white text-black"
              )}
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

