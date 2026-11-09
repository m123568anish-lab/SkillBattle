"use client";

import React from "react";

interface GridBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  showMovingGrid?: boolean;
  showAmbientGlow?: boolean;
}

/**
 * GridBackground — Technical, cinematic developer command center background.
 * Uses high-performance CSS-first SVG grid, noise texture, and subtle ambient glow.
 * Pauses when tab is hidden and respects prefers-reduced-motion.
 */
export default function GridBackground({
  children,
  className = "",
  showMovingGrid = true,
  showAmbientGlow = true,
}: GridBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden select-none ${className}`}
    >
      {/* 1. Technical SVG Grid Layer with extremely subtle opacity */}
      {showMovingGrid && (
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.045] motion-reduce:animation-none"
          style={{
            backgroundImage: `linear-gradient(to right, var(--text-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            animation: "subtle-grid-drift 24s linear infinite",
          }}
        />
      )}

      {/* 2. Micro Noise Texture (Cinematic film-grade grain, 0.02 opacity) */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 3. Slow Ambient Radial Lighting (Hero Command Center glow) */}
      {showAmbientGlow && (
        <>
          {/* Top-center electric lime ambient highlight */}
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full blur-[140px] pointer-events-none motion-reduce:hidden"
            style={{
              background: `radial-gradient(circle, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 70%)`,
            }}
          />

          {/* Bottom-right deep charcoal surface depth glow */}
          <div
            className="absolute -bottom-48 right-0 h-[600px] w-[600px] rounded-full blur-[160px] pointer-events-none motion-reduce:hidden"
            style={{
              background: `radial-gradient(circle, color-mix(in srgb, var(--surface-subtle) 40%, transparent) 0%, transparent 70%)`,
            }}
          />
        </>
      )}

      {children}
    </div>
  );
}
