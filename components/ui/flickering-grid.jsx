/**
 * FlickeringGrid Component
 * Animated flickering grid background
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
}) {
  const canvasRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;

    const columns = Math.floor(canvas.width / (squareSize + gridGap));
    const rows = Math.floor(canvas.height / (squareSize + gridGap));

    const squares = [];

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        squares.push({
          x: i * (squareSize + gridGap),
          y: j * (squareSize + gridGap),
          opacity: Math.random() * maxOpacity,
        });
      }
    }

    const render = () => {
      if (!isInView) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      squares.forEach((square) => {
        if (Math.random() < flickerChance) {
          square.opacity = Math.random() * maxOpacity;
        }

        ctx.fillStyle = color.replace("rgb(", "rgba(").replace(")", `, ${square.opacity})`);
        ctx.fillRect(square.x, square.y, squareSize, squareSize);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    squareSize,
    gridGap,
    flickerChance,
    color,
    maxOpacity,
    isInView,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => {
      if (canvasRef.current) {
        observer.unobserve(canvasRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn("pointer-events-none", className)}
    />
  );
}

export default FlickeringGrid;

