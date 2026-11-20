"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileForm from "@/components/profile/ProfileForm";
import { ArrowUpRight, Shield, UserRound } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1200px] space-y-6 pb-8 sm:space-y-8">
        {/* Profile Command Header */}
        <header className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                <UserRound className="h-3 w-3 text-[var(--accent)]" aria-hidden="true" />
                Engineering Portfolio
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)]">
                <Shield className="h-3 w-3 text-emerald-400" />
                Verified Identity
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Profile & Portfolio
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Your verified technical credentials, academic background, career goals, and campus recruiter visibility.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/career/roadmap"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 text-xs font-bold text-[var(--text-secondary)] transition-all hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              Curriculum Roadmap
            </Link>
            <Link
              href="/settings"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-xs font-bold text-[var(--text-primary)] shadow-sm transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              Account Settings
              <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent-strong)]" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <ProfileForm />
      </div>
    </DashboardLayout>
  );
}
