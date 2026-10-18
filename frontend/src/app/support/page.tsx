import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Mail } from "lucide-react";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Support | SkillBattle",
  description: "Find SkillBattle help and contact support.",
};

export default function SupportPage() {
  return <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#050816] text-white outline-none">
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <Link href="/" className="text-sm font-bold text-cyan-300 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">SkillBattle</Link>
      <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Support center</p><h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">Answers when you need them.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Start with the help center for common SkillBattle questions. If you still need assistance, email our support team with the details of your issue.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2"><Link href="/faq" className="group rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5 transition hover:border-cyan-300 hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><BookOpen className="text-cyan-300" size={22} aria-hidden="true" /><h2 className="mt-5 text-lg font-bold">Browse the help center</h2><p className="mt-2 text-sm leading-6 text-slate-300">Find guidance about accounts, opportunities, applications, and learning.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-200">View FAQs <ArrowUpRight size={16} aria-hidden="true" /></span></Link><a href="mailto:support@skillbattle.app?subject=SkillBattle%20support" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"><Mail className="text-cyan-300" size={22} aria-hidden="true" /><h2 className="mt-5 text-lg font-bold">Email support</h2><p className="mt-2 text-sm leading-6 text-slate-300">Open your email client to contact the team through the established support channel.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-200">Contact support <ArrowUpRight size={16} aria-hidden="true" /></span></a></div>
      </section>
    </div><Footer />
  </main>;
}
