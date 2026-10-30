import React from "react";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  type?: "card" | "line" | "table-row";
}

export function LoadingSkeleton({ className = "", count = 1, type = "card" }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === "line") {
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i} className={`h-4 rounded bg-white/[0.06] animate-pulse ${className}`} />
        ))}
      </div>
    );
  }

  if (type === "table-row") {
    return (
      <div className="space-y-2">
        {items.map((i) => (
          <div
            key={i}
            className={`flex items-center gap-4 rounded-lg border border-white/[0.04] bg-white/[0.02] p-4 animate-pulse ${className}`}
          >
            <div className="h-8 w-8 rounded-full bg-white/[0.08]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-white/[0.08]" />
              <div className="h-3 w-1/4 rounded bg-white/[0.04]" />
            </div>
            <div className="h-6 w-16 rounded bg-white/[0.08]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((i) => (
        <div
          key={i}
          className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4 animate-pulse ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 rounded bg-white/[0.08]" />
            <div className="h-5 w-12 rounded-full bg-white/[0.08]" />
          </div>
          <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
          <div className="h-3 w-full rounded bg-white/[0.04]" />
          <div className="pt-2 flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-white/[0.04]" />
            <div className="h-8 w-24 rounded-lg bg-white/[0.08]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
