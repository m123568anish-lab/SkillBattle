import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BattleCreateForm from "@/components/battle/BattleCreateForm";

export default function NewBattlePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <section className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 sm:p-8 text-[var(--text-primary)]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Create battle</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">Start a new battle room</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-[var(--text-secondary)]">
            Create a custom battle challenge, invite peers to join, and compete in real-time with automatic test validation.
          </p>
        </section>
        <BattleCreateForm />
      </div>
    </DashboardLayout>
  );
}
