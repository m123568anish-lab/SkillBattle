"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Code2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ExternalOpportunitySearch from "@/components/opportunities/ExternalOpportunitySearch";

export default function PlacementPage() {
  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-6 pb-8">
        <header className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-[#0b1324] to-violet-500/10 p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Internships & placements</p>
          <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">Find current opportunities</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            Search live external internships and placements or browse employer-posted opportunities on SkillBattle.
            External listings stay on their original websites and are not represented as SkillBattle-verified.
          </p>
        </header>

        <ExternalOpportunitySearch />

        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/opportunities"
            className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b1020] p-5 transition hover:border-cyan-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span>
              <span className="flex items-center gap-2 text-sm font-bold text-white"><BriefcaseBusiness size={17} className="text-cyan-300" /> SkillBattle company listings</span>
              <span className="mt-2 block text-xs text-slate-400">Only published listings from verified company accounts.</span>
            </span>
            <ArrowRight size={17} className="shrink-0 text-cyan-300" />
          </Link>
          <Link
            href="/tasks"
            className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b1020] p-5 transition hover:border-cyan-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span>
              <span className="flex items-center gap-2 text-sm font-bold text-white"><Code2 size={17} className="text-cyan-300" /> Practice tasks</span>
              <span className="mt-2 block text-xs text-slate-400">Work on problems currently available in the practice catalog.</span>
            </span>
            <ArrowRight size={17} className="shrink-0 text-cyan-300" />
          </Link>
        </section>
      </main>
    </DashboardLayout>
  );
}
