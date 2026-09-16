"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FriendPanel from "@/components/friend/FriendPanel";

export default function SocialPage() {
  return (
    <DashboardLayout>
      <section className="grid gap-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl backdrop-blur-xl md:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Social hub</p>
          <h1 className="mt-2 text-3xl font-black">Find your next rival</h1>
          <p className="mt-3 text-slate-400">
            Search by user ID and build a real squad from your authenticated account.
          </p>
        </div>
        <FriendPanel />
      </section>
    </DashboardLayout>
  );
}
