"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileForm from "@/components/profile/ProfileForm";
import FriendPanel from "@/components/friend/FriendPanel";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <section className="grid gap-6 xl:grid-cols-[0.75fr_0.45fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#101a2c] to-[#0a0f1d] p-5 sm:p-7 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Your profile</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">A clear picture of your skills</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Manage your profile photo, learning history, education, career goals, and public links from one place.</p>
          </div>

          <ProfileForm />
        </div>

        <FriendPanel />
      </section>
    </DashboardLayout>
  );
}
