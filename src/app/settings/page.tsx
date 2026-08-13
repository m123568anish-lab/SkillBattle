"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SettingsPage from "@/components/settings/SettingsPage";

export default function SettingsRoutePage() {
    return (
        <DashboardLayout>
            <section className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl shadow-violet-950/20">
                    <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Settings</p>
                    <h1 className="mt-2 text-4xl font-black">Account security and battle controls</h1>
                    <p className="mt-3 max-w-2xl text-slate-400">Manage your password, customize match settings, and keep your account tuned for high-stakes matchmaking.</p>
                </div>

                <SettingsPage />
            </section>
        </DashboardLayout>
    );
}