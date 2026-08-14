"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";
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
  ...props
}: GradientButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-white hover:shadow-cyan-500/30",

    secondary:
      "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white hover:shadow-pink-500/30",

    success:
      "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-500/30",

    danger:
      "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-red-500/30",

    ghost:
      "border border-white/10 bg-white/5 text-white hover:bg-white/10",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl",
        "active:scale-95",
        "disabled:pointer-events-none disabled:opacity-60",
        fullWidth && "w-full",
        variants[variant],
        className
      )}
      {...props}
    >
      {loading && (
        <Loader2 className="h-5 w-5 animate-spin" />
      )}

      {children}
    </button>
  );
}