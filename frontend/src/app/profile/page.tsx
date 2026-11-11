"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileForm from "@/components/profile/ProfileForm";
import { ArrowUpRight, UserRound } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <section className="mx-auto max-w-[1120px] space-y-5 pb-4 sm:space-y-7">
        <header className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              Your space
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Profile
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Your learning identity, education, career goals, and professional links.
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] sm:self-auto"
          >
            Account settings
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        <ProfileForm />
      </section>
    </DashboardLayout>
  );
}
