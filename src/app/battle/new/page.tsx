import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BattleCreateForm from "@/components/battle/BattleCreateForm";

export default function NewBattlePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl shadow-violet-950/20">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Create battle</p>
          <h1 className="mt-2 text-4xl font-black">Start a new battle room</h1>
          <p className="mt-4 max-w-2xl text-slate-400">
            Create a fresh battle challenge, invite others to join, and track the live scoreboard as the match progresses.
          </p>
        </section>
        <BattleCreateForm />
      </div>
    </DashboardLayout>
  );
}
