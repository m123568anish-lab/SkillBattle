import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ExternalJobBoards from "@/components/opportunities/ExternalJobBoards";

export default function CompanySpeedrunPage() {
  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-6 pb-8">
        <section className="rounded-3xl border border-white/10 bg-[#0b1020] p-6 text-white sm:p-8">
          <BriefcaseBusiness size={28} className="text-cyan-300" />
          <h1 className="mt-4 text-2xl font-bold">Company-specific simulations are unavailable</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            The previous sample assessments were not official employer tests. They have been removed.
            Browse current openings or practice using problems published in the live catalog.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/opportunities" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400">
              Browse opportunities <ArrowRight size={15} />
            </Link>
            <Link href="/tasks" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
              Practice tasks
            </Link>
          </div>
        </section>
        <ExternalJobBoards />
      </main>
    </DashboardLayout>
  );
}
