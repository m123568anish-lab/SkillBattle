import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function PlacementScorecardPage() {
  return (
    <DashboardLayout>
      <main className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#0b1020] p-6 text-white sm:p-8">
        <BriefcaseBusiness size={28} className="text-cyan-300" />
        <h1 className="mt-4 text-2xl font-bold">Placement scorecards are unavailable</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          SkillBattle does not yet have enough validated assessment and hiring data to calculate a reliable placement score.
          No score or employer eligibility is shown until it can be based on your actual results.
        </p>
        <Link
          href="/placement"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Browse opportunities <ArrowRight size={15} />
        </Link>
      </main>
    </DashboardLayout>
  );
}
