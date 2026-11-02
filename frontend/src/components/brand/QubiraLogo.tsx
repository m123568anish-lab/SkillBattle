"use client";

import React from "react";
import Link from "next/link";

export interface QubiraLogoProps {
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  showTagline?: boolean;
  portalBadge?: string;
  className?: string;
}

export function QubiraIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="q_logo_bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0E1526" />
          <stop offset="100%" stopColor="#080D1A" />
        </linearGradient>
        <linearGradient id="q_logo_ring" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="q_logo_tail" x1="32" y1="32" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Rounded Hex/Square Container */}
      <rect width="64" height="64" rx="16" fill="url(#q_logo_bg)" />
      <rect width="64" height="64" rx="16" stroke="#06B6D4" strokeOpacity="0.3" strokeWidth="1.5" />

      {/* Geometric Q Nexus Ring */}
      <circle cx="32" cy="30" r="15" stroke="url(#q_logo_ring)" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="80 12" />

      {/* Core Node */}
      <circle cx="32" cy="30" r="4" fill="#22D3EE" />

      {/* Dynamic Forward Momentum Tail */}
      <path d="M38 36L49 47M43 47H49V41" stroke="url(#q_logo_tail)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function QubiraLogo({
  variant = "full",
  size = "md",
  href,
  showTagline = false,
  portalBadge,
  className = "",
}: QubiraLogoProps) {
  const iconSizeMap = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 52,
  };

  const textStyleMap = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-3xl",
  };

  const content = (
    <div className={`group inline-flex items-center gap-2.5 select-none ${className}`}>
      {variant !== "wordmark" && (
        <QubiraIcon size={iconSizeMap[size]} />
      )}

      {variant !== "icon" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-white transition-colors group-hover:text-cyan-300 ${textStyleMap[size]}`}
            >
              QUBIRA
            </span>
            {portalBadge && (
              <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-cyan-300 border border-cyan-400/20">
                {portalBadge}
              </span>
            )}
          </div>
          {showTagline && (
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-cyan-400/80 mt-0.5">
              Learn. Build. Compete.
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} title="Qubira — Learn. Build. Compete." className="transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}

export default QubiraLogo;
