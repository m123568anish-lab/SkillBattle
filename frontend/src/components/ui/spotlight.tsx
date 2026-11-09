"use client";

import React from "react";
import { useCursorSpotlight } from "@/hooks/use-cursor-spotlight";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightRadius?: number;
  interactive?: boolean;
}

/**
 * SpotlightCard — Premium cursor-responsive surface for Qubira Black Edition.
 * Tracks pointer on the card with zero visible lag using direct CSS custom properties.
 * Disables on touch devices and respects prefers-reduced-motion.
 */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "color-mix(in srgb, var(--accent) 10%, transparent)",
  spotlightRadius = 280,
  interactive = true,
  ...props
}: SpotlightCardProps) {
  const { ref, onPointerMove, onPointerLeave } = useCursorSpotlight();

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`
        group relative overflow-hidden rounded-2xl
        border border-[var(--border-default)]
        bg-[var(--surface-card)]
        text-[var(--text-primary)]
        transition-[border-color,transform,box-shadow] duration-200 ease-out
        ${interactive ? "hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5),0_0_16px_-4px_color-mix(in srgb,var(--accent)_14%,transparent)]" : ""}
        ${className}
      `}
      {...props}
    >
      {/* Soft Cursor Spotlight Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 ease-out motion-reduce:hidden"
        style={{
          opacity: "var(--spotlight-opacity, 0)",
          background: `radial-gradient(circle ${spotlightRadius}px at var(--mouse-x, 50%) var(--mouse-y, 50%), ${spotlightColor}, transparent 75%)`,
        }}
      />

      {/* Surface content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

/**
 * Reusable CursorSpotlight overlay for custom hero sections.
 */
export function CursorSpotlight({
  radius = 340,
  color = "color-mix(in srgb, var(--accent) 12%, transparent)",
  className = "",
}: {
  radius?: number;
  color?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 ease-out motion-reduce:hidden ${className}`}
      style={{
        opacity: "var(--spotlight-opacity, 0)",
        background: `radial-gradient(circle ${radius}px at var(--mouse-x, 50%) var(--mouse-y, 50%), ${color}, transparent 70%)`,
      }}
    />
  );
}

/**
 * Ambient Hero Spotlight for deep command center lighting.
 */
export default function Spotlight({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`
        pointer-events-none
        absolute
        -top-32
        left-1/2
        -translate-x-1/2
        h-[480px]
        w-[720px]
        rounded-full
        bg-gradient-to-b
        from-[var(--accent)]/10
        via-[var(--surface-elevated)]/20
        to-transparent
        blur-[120px]
        motion-reduce:hidden
        ${className}
      `}
    />
  );
}
