"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileForm from "@/components/profile/ProfileForm";
import FriendPanel from "@/components/friend/FriendPanel";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <section className="grid gap-6 xl:grid-cols-[0.75fr_0.45fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 text-white shadow-2xl shadow-black/50">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">Battle Profile Hub</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">Your Battle Identity</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Update your profile details, manage your verified avatar, and keep your competitive credentials ready for matches and placement matching.</p>
          </div>

          <ProfileForm />
        </div>

        <FriendPanel />
      </section>
    </DashboardLayout>
  );
}
