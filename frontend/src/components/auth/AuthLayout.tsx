import * as React from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, Sparkles } from "lucide-react";
import { QubiraLogo } from "@/components/brand/QubiraLogo";

interface AuthLayoutProps {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}

const ecosystemCards = [
  { label: "Student", detail: "Learn • Build • Compete", icon: GraduationCap },
  { label: "College", detail: "Assess • Train • Place", icon: Building2 },
  { label: "Company", detail: "Discover • Hire • Scale", icon: BriefcaseBusiness },
] as const;

export default function AuthLayout({
  children,
  eyebrow = "Qubira Ecosystem",
  title = "Build your competitive edge.",
  description = "One secure identity for students, campuses, and engineering teams mastering technical excellence together.",
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative flex min-h-[260px] flex-col justify-between overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),transparent_28%),linear-gradient(135deg,#070B14_0%,#0B1220_52%,#111A2B_100%)] px-6 py-7 text-white sm:px-10 sm:py-9 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-12 lg:py-10">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:52px_52px]" />
          <div className="pointer-events-none absolute left-6 top-24 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-8 right-10 h-52 w-52 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <QubiraLogo variant="full" size="md" href="/" showTagline />
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-white lg:hidden">
              Home <ArrowRight size={14} />
            </Link>
          </div>

          <div className="relative z-10 max-w-lg my-auto py-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
              <Sparkles size={12} />
              {eyebrow}
            </div>
            <h2 className="text-4xl font-black leading-[0.96] tracking-[-0.06em] text-white sm:text-5xl lg:text-[3.2rem]">
              {title}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">{description}</p>

            <div className="mt-8 grid gap-3">
              {ecosystemCards.map(({ label, detail, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-violet-500/15 text-cyan-200">
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-xs text-slate-400">{detail}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-cyan-300">Active</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-xs text-slate-400">
            © 2026 Qubira. Learn. Build. Compete.
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl">{children}</div>
        </section>
      </div>
    </main>
  );
}
