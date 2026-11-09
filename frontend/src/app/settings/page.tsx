"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SettingsPage from "@/components/settings/SettingsPage";
import { Sliders } from "lucide-react";

export default function SettingsRoutePage() {
  return (
    <DashboardLayout>
      <section className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-default,#202022)] bg-[var(--surface-card,#0D0D0D)] p-6 sm:p-8 text-[var(--text-primary,#F5F5F5)] shadow-2xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl opacity-15"
            style={{
              background: "radial-gradient(circle, var(--accent,#D8FF3E) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent,#D8FF3E)]/20 bg-[var(--accent,#D8FF3E)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent,#D8FF3E)]">
              <Sliders size={12} />
              <span>Control Center</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl text-[var(--text-primary,#F5F5F5)]">
              Account & System Settings
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary,#999999)]">
              Manage your profile photo, identity credentials, notification channels, visual theme, and active security sessions.
            </p>
          </div>
        </div>

        <SettingsPage />
      </section>
    </DashboardLayout>
  );
}
