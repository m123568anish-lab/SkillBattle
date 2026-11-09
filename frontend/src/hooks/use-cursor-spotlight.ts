"use client";

import { useEffect, useRef, useCallback } from "react";

interface SpotlightOptions {
  disabled?: boolean;
}

export function useCursorSpotlight<T extends HTMLElement = HTMLDivElement>(
  options: SpotlightOptions = {}
) {
  const containerRef = useRef<T>(null);
  const rafId = useRef<number | null>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      if (options.disabled) return;
      if (e.pointerType === "touch") return;

      const element = containerRef.current;
      if (!element) return;

      // Cancel previous scheduled frame to avoid queuing
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }

      const clientX = e.clientX;
      const clientY = e.clientY;

      rafId.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        containerRef.current.style.setProperty("--mouse-x", `${x}px`);
        containerRef.current.style.setProperty("--mouse-y", `${y}px`);
        containerRef.current.style.setProperty("--spotlight-opacity", "1");
      });
    },
    [options.disabled]
  );

  const handlePointerLeave = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (containerRef.current) {
      containerRef.current.style.setProperty("--spotlight-opacity", "0");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return {
    ref: containerRef,
    onPointerMove: handlePointerMove,
    onPointerLeave: handlePointerLeave,
  };
}
