import * as React from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, Code2, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}

const ecosystemCards = [
  { label: "Student", detail: "Learn • Practice • Battle", icon: GraduationCap },
  { label: "College", detail: "Assess • Train • Place", icon: Building2 },
  { label: "Company", detail: "Discover • Hire • Scale", icon: BriefcaseBusiness },
] as const;

export default function AuthLayout({
  children,
  eyebrow = "SkillBattle ecosystem",
  title = "Build your competitive edge.",
  description = "One secure identity for students, colleges, and companies building stronger outcomes together.",
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[0.82fr_1.18fr]">
        <section className="relative flex min-h-[260px] flex-col justify-between overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),transparent_22%),linear-gradient(135deg,#070B14_0%,#0B1220_52%,#111A2B_100%)] px-6 py-7 text-white sm:px-10 sm:py-9 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-9 lg:py-8">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:52px_52px]" />
          <div className="pointer-events-none absolute left-6 top-24 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-8 right-10 h-52 w-52 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex w-fit items-center gap-2" aria-label="SkillBattle home">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]">
                <Code2 size={16} />
              </span>
              <span className="text-base font-black tracking-tight">SkillBattle</span>
            </Link>
            <Link href="/" className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-200 transition hover:border-cyan-400/40 hover:text-white lg:hidden">
              Home
            </Link>
          </div>

          <div className="relative z-10 max-w-lg pt-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles size={10} />
              {eyebrow}
            </div>
            <h2 className="text-3xl font-black leading-[1] tracking-[-0.05em] text-white sm:text-4xl lg:text-[2.6rem]">
              {title}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">{description}</p>

            <div className="mt-8 grid gap-3">
              {ecosystemCards.map(({ label, detail, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-violet-500/15 text-cyan-200">
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{label}</p>
                      <p className="text-xs text-slate-400">{detail}</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-slate-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-5 flex flex-col gap-2 text-xs text-slate-300 lg:mt-0">
            <div className="flex items-center gap-2 border-t border-white/10 pt-3">
              <ShieldCheck size={15} className="text-violet-300" />
              <span>Secure access with backend-verified role checks.</span>
            </div>
            <Link href="/" className="hidden w-fit items-center gap-1 text-xs text-slate-400 transition hover:text-white lg:inline-flex">
              Back to SkillBattle <ArrowRight size={12} />
            </Link>
          </div>
        </section>

        <section className="flex items-start justify-center bg-[#050816] px-4 py-8 sm:px-8 sm:py-10 lg:items-center lg:px-8 xl:px-10">
          <div className="w-full max-w-[590px] rounded-[32px] border border-white/10 bg-white/[0.02] p-2 shadow-[0_35px_80px_rgba(15,23,42,0.78)] backdrop-blur-sm">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
