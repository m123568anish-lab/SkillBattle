"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileForm from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <section className="space-y-6">
        <div className="hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#101a2c] to-[#0a0f1d] p-5 text-white sm:p-7 lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Your profile</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Your SkillBattle profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">View your account details, learning progress, education, career goals, and public links.</p>
        </div>

        <ProfileForm />
      </section>
    </DashboardLayout>
  );
}
