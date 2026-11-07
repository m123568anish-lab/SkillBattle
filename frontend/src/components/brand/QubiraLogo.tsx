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
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="19"
        fill="var(--surface-elevated)"
        stroke="var(--border-default)"
        strokeWidth="2"
      />
      <path
        d="M32 13C21.507 13 13 21.507 13 32s8.507 19 19 19c4.087 0 7.87-1.29 10.96-3.483L49 53"
        stroke="var(--accent-strong)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 21a11 11 0 1 0 0 22 11 11 0 0 0 0-22Z"
        fill="var(--accent)"
        fillOpacity=".15"
      />
      <circle cx="32" cy="32" r="4" fill="var(--accent)" />
      <path
        d="m43 43 9 9"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="48" y="13" width="4" height="4" rx="1" fill="var(--accent)" />
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
              className={`font-black tracking-[0.16em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-strong)] ${textStyleMap[size]}`}
            >
              QUBIRA
            </span>
            {portalBadge && (
              <span className="rounded-sm bg-[var(--accent)]/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[var(--accent-strong)] border border-[var(--border-default)]">
                {portalBadge}
              </span>
            )}
          </div>
          {showTagline && (
            <span className="mt-1 text-[9px] font-semibold tracking-[0.18em] uppercase text-[var(--text-muted)]">
              Learn. Build. Compete.
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Qubira — Learn. Build. Compete."
        title="Qubira — Learn. Build. Compete."
        className="transition-opacity hover:opacity-95"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default QubiraLogo;
