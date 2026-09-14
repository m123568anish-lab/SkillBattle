"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Single animate-pulse skeleton line/block */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-white/[0.06]",
        className
      )}
    />
  );
}

/** Skeleton for a stats card (icon + label + value) */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#070B14]/40 p-3.5 flex flex-col items-start backdrop-blur-xl">
      <Skeleton className="h-4 w-4 mb-2" />
      <Skeleton className="h-2.5 w-16 mb-1" />
      <Skeleton className="h-5 w-20 mt-1" />
    </div>
  );
}

/** Skeleton for an entire dashboard hero card */
export function DashboardHeroSkeleton() {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#070B14] to-[#020617] p-6 sm:p-8 animate-pulse">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        {/* Avatar + info */}
        <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
          <div className="h-28 w-28 rounded-3xl bg-white/[0.06] flex-shrink-0" />
          <div className="space-y-3 w-full max-w-xs">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3.5 w-full md:w-64">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for a content panel (leaderboard, AI Coach, etc.) */
export function PanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-[#090D1A]/40 p-6 backdrop-blur-xl space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
