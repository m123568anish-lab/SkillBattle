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
        x="3"
        y="3"
        width="58"
        height="58"
        rx="17"
        fill="var(--surface-elevated)"
        stroke="var(--border-default)"
        strokeWidth="1.5"
      />
      <path
        d="M43.1 45.7A18.5 18.5 0 1 1 49 32"
        stroke="var(--accent-strong)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m25 25-7 7 7 7m14-14 7 7-7 7m-5-16-5 18"
        stroke="var(--text-primary)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m43 43 10 10"
        stroke="var(--accent)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <circle cx="49" cy="15" r="2.5" fill="var(--accent)" />
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
              className={`font-black tracking-[0.12em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-strong)] ${textStyleMap[size]}`}
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
