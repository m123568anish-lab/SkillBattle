"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost" | "command";
  loading?: boolean;
  fullWidth?: boolean;
}

export default function GradientButton({
  children,
  className,
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  type = "button",
  ...props
}: GradientButtonProps) {
  const variants = {
    primary:
      "bg-[var(--accent)] text-[var(--text-on-accent)] font-bold hover:bg-[var(--accent-strong)] hover:shadow-[0_0_20px_rgba(200,239,114,0.3)] border border-transparent",

    secondary:
      "border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-subtle)] hover:shadow-lg",

    command:
      "border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[var(--accent-strong)] hover:bg-[var(--surface-elevated)]",

    success:
      "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400/50 hover:shadow-emerald-500/20",

    danger:
      "border border-rose-500/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 hover:border-rose-400/50 hover:shadow-rose-500/20",

    ghost:
      "border border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 ease-out",
        "hover:-translate-y-0.5 hover:shadow-md",
        "active:scale-[0.98] active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)]",
        "disabled:pointer-events-none disabled:opacity-40",
        fullWidth && "w-full",
        variants[variant],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0 text-current" />}
      {children}
    </button>
  );
}
