import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function SoloBattlePage() {
  return (
    <DashboardLayout>
      <main className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#0b1020] p-6 text-white sm:p-8">
        <Code2 size={28} className="text-cyan-300" />
        <h1 className="mt-4 text-2xl font-bold">Practice from the live problem catalog</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          The bundled sample battle questions have been removed. Start a practice session from the current problem catalog;
          if no problems are available, the page will show an empty state instead of sample questions.
        </p>
        <Link
          href="/tasks"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Open practice tasks <ArrowRight size={15} />
        </Link>
      </main>
    </DashboardLayout>
  );
}
