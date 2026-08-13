import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BattleLobby from "@/components/battle/BattleLobby";

export default function BattlePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl shadow-violet-950/20">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">SkillBattle</p>
          <h1 className="mt-2 text-4xl font-black">Battle Arena & Campaign</h1>
          <p className="mt-4 max-w-2xl text-slate-400">
            Jump into live ranked battles, create custom duels, or progress through the Campaign Quest Map — clearing levels one by one to earn stars, CP, and rank up.
          </p>
        </section>

        <BattleLobby />
      </div>
    </DashboardLayout>
  );
}