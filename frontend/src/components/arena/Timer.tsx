import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  initialSeconds: number;
  onTimeout?: () => void;
  paused?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Timer({
  initialSeconds,
  onTimeout,
  paused = false,
  className = "",
  size = "md",
}: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (paused || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paused, secondsLeft, onTimeout]);

  const minutes = Math.floor(secondsLeft / 60);
  const remainingSecs = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;

  const isUrgent = secondsLeft < 60;
  const isCritical = secondsLeft < 10;

  const colorStyles = isCritical
    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
    : isUrgent
    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
    : "bg-white/[0.06] text-slate-200 border-white/[0.12]";

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-base font-bold gap-2.5",
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-lg border font-mono tracking-widest font-semibold transition-colors ${colorStyles} ${sizeStyles} ${className}`}
      role="timer"
      aria-label={`Time remaining: ${formatted}`}
    >
      <Clock className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span>{formatted}</span>
    </div>
  );
}

export default Timer;
