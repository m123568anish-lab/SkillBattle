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
      <rect width="64" height="64" rx="13" fill="var(--surface-elevated)" />
      <path d="M12 12H52V52H12V12Z" stroke="var(--border-default)" strokeWidth="1.5" />
      <circle cx="31" cy="31" r="12" stroke="var(--accent)" strokeWidth="4" />
      <path d="M37 37L49 49" stroke="var(--accent)" strokeWidth="4" strokeLinecap="square" />
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
            <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-[var(--text-muted)] mt-0.5">
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
