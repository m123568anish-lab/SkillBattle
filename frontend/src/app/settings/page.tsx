"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SettingsPage from "@/components/settings/SettingsPage";

export default function SettingsRoutePage() {
    return (
        <DashboardLayout>
            <section className="space-y-6">
                <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#101a2c] to-[#0a0f1d] p-5 sm:p-7 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Preferences</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Account and experience</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Review the account, notification, privacy, and session controls available for your profile.</p>
                </div>

                <SettingsPage />
            </section>
        </DashboardLayout>
    );
}
