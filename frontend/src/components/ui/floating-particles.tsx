"use client";

import React from "react";

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

/**
 * FloatingParticles — Minimal, sparse micro-particles for hero banners.
 * CSS-only animations with varying durations and delays.
 * Strict reduced-motion compliance and zero performance overhead.
 */
export default function FloatingParticles({
  count = 8,
  className = "",
}: FloatingParticlesProps) {
  // Deterministic particle positions and timings
  const particleConfigs = [
    { left: "12%", top: "65%", size: 2.5, duration: "14s", delay: "0s", opacity: 0.25 },
    { left: "28%", top: "80%", size: 2, duration: "18s", delay: "2.5s", opacity: 0.18 },
    { left: "44%", top: "70%", size: 3, duration: "16s", delay: "1.2s", opacity: 0.3 },
    { left: "62%", top: "85%", size: 2, duration: "20s", delay: "4s", opacity: 0.2 },
    { left: "78%", top: "60%", size: 2.5, duration: "15s", delay: "3s", opacity: 0.22 },
    { left: "88%", top: "75%", size: 3, duration: "17s", delay: "1.8s", opacity: 0.28 },
    { left: "35%", top: "90%", size: 1.5, duration: "19s", delay: "5s", opacity: 0.15 },
    { left: "70%", top: "92%", size: 2, duration: "21s", delay: "6s", opacity: 0.2 },
  ].slice(0, count);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none motion-reduce:hidden ${className}`}
    >
      {particleConfigs.map((cfg, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[var(--accent)]"
          style={{
            left: cfg.left,
            top: cfg.top,
            width: `${cfg.size}px`,
            height: `${cfg.size}px`,
            opacity: cfg.opacity,
            boxShadow: `0 0 6px var(--accent)`,
            animation: `subtle-float-${i % 3} ${cfg.duration} ease-in-out infinite alternate`,
            animationDelay: cfg.delay,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes subtle-float-0 {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.1;
          }
          50% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(-80px) translateX(12px);
            opacity: 0.05;
          }
        }
        @keyframes subtle-float-1 {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.15;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-95px) translateX(-15px);
            opacity: 0.08;
          }
        }
        @keyframes subtle-float-2 {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.08;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-70px) translateX(8px);
            opacity: 0.02;
          }
        }
      `}</style>
    </div>
  );
}
