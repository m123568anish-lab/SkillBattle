"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SettingsPage from "@/components/settings/SettingsPage";

export default function SettingsRoutePage() {
    return (
        <DashboardLayout>
            <section className="space-y-6">
                <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 text-white shadow-2xl shadow-black/50">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">Platform Settings</p>
                    <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">Account & Experience Controls</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Manage security credentials, two-factor authentication, appearance themes, notifications, and candidate sharing controls.</p>
                </div>

                <SettingsPage />
            </section>
        </DashboardLayout>
    );
}