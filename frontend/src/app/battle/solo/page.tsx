import BattleArea from "@/components/BattleArea";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function SoloBattlePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl shadow-violet-950/20 sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">SkillBattle</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Daily Adaptive Battle</h1>
          <p className="mt-4 max-w-2xl text-slate-400">
            Practice with questions selected from your verified performance history. Your progress is saved as you submit each answer.
          </p>
        </header>
        <BattleArea />
      </div>
    </DashboardLayout>
  );
}
