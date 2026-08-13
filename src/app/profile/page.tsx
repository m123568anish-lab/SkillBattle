"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProfileForm from "@/components/profile/ProfileForm";
import FriendPanel from "@/components/friend/FriendPanel";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <section className="grid gap-6 xl:grid-cols-[0.75fr_0.45fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl shadow-violet-950/20">
            <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Profile hub</p>
            <h1 className="mt-2 text-4xl font-black">Your battle identity</h1>
            <p className="mt-3 max-w-2xl text-slate-400">Update your profile details, personalize your avatar, and keep your account game-ready for squad battles and tournaments.</p>
          </div>

          <ProfileForm />
        </div>

        <FriendPanel />
      </section>
    </DashboardLayout>
  );
}
