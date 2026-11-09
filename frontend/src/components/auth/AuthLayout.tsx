import * as React from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { QubiraLogo } from "@/components/brand/QubiraLogo";
import { ThemeToggle } from "@/components/common/ExperienceEnhancements";

interface AuthLayoutProps {
  children: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}

const ecosystemCards = [
  {
    label: "Student",
    detail: "Learn • Build • Compete",
    icon: GraduationCap,
    badge: "1v1 Duels & Prep",
  },
  {
    label: "College",
    detail: "Assess • Train • Place",
    icon: Building2,
    badge: "Batch Analytics",
  },
  {
    label: "Company",
    detail: "Discover • Hire • Scale",
    icon: BriefcaseBusiness,
    badge: "Live Tech Screen",
  },
] as const;

export default function AuthLayout({
  children,
  eyebrow = "Qubira Ecosystem",
  title = "Build your competitive edge.",
  description = "One secure identity for students, campuses, and engineering teams mastering technical excellence together.",
}: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen bg-[var(--surface-canvas,#050505)] text-[var(--text-primary,#F5F5F5)]">
      {/* Background Subtle Technical Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:40px_40px]"
      />

      {/* Subtle Ambient Radial Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 right-1/4 h-[500px] w-[500px] rounded-full blur-[140px] opacity-20"
        style={{
          background: "radial-gradient(circle, var(--accent,#D8FF3E) 0%, transparent 70%)",
        }}
      />

      {/* Mobile Top Navigation Bar (Hidden on Desktop) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border-default,#202022)] bg-[var(--surface-canvas,#050505)]/85 px-4 py-3.5 backdrop-blur-md lg:hidden">
        <QubiraLogo variant="full" size="sm" href="/" showTagline />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-default,#292929)] bg-[var(--surface-elevated,#0D0D0D)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary,#999999)] transition hover:border-[var(--accent,#D8FF3E)]/40 hover:text-[var(--text-primary,#F5F5F5)]"
          >
            Home <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.05fr_0.95fr]">
        {/* Desktop Left Brand & Editorial Section (Hidden on Mobile) */}
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-[var(--border-default,#202022)] bg-[var(--surface-canvas,#070708)] px-10 py-10 text-white lg:flex xl:px-14 xl:py-12">
          {/* Top Brand Bar */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <QubiraLogo variant="full" size="md" href="/" showTagline />
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default,#292929)] bg-[var(--surface-elevated,#0D0D0D)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary,#999999)] transition hover:border-[var(--accent,#D8FF3E)]/40 hover:text-[var(--text-primary,#F5F5F5)]"
            >
              Explore platform <ArrowRight size={14} />
            </Link>
          </div>

          {/* Center Editorial Column */}
          <div className="relative z-10 my-auto max-w-lg py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent,#D8FF3E)]/30 bg-[var(--accent,#D8FF3E)]/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong,#D8FF3E)]">
              <Sparkles size={12} />
              {eyebrow}
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[var(--text-primary,#F5F5F5)] xl:text-5xl">
              {title}
            </h1>

            <p className="mt-5 text-sm leading-relaxed text-[var(--text-secondary,#999999)] xl:text-base">
              {description}
            </p>

            {/* Ecosystem Badges */}
            <div className="mt-9 space-y-3">
              {ecosystemCards.map(({ label, detail, icon: Icon, badge }) => (
                <div
                  key={label}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-default,#202022)] bg-[var(--surface-elevated,#0D0D0D)] p-3.5 transition-all duration-200 hover:border-[var(--border-focus,#38383c)]"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] text-[var(--accent,#D8FF3E)] transition-colors group-hover:border-[var(--accent,#D8FF3E)]/40">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary,#F5F5F5)]">{label} Space</p>
                      <p className="text-[11px] text-[var(--text-muted,#888888)]">{detail}</p>
                    </div>
                  </div>
                  <span className="rounded-md border border-[var(--border-default,#292929)] bg-[var(--surface-card,#111113)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary,#999999)]">
                    {badge}
                  </span>
                </div>
              ))}
            </div>

            {/* Platform Trust Note */}
            <div className="mt-8 flex items-center gap-2 text-xs text-[var(--text-muted,#777777)]">
              <ShieldCheck size={14} className="text-[var(--accent,#D8FF3E)]" />
              <span>Enterprise encrypted sessions · High-concurrency battle execution engine</span>
            </div>
          </div>

          {/* Desktop Footer */}
          <div className="relative z-10 flex items-center justify-between text-xs text-[var(--text-muted,#666666)]">
            <span>© 2026 Qubira. Learn. Build. Compete.</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="transition hover:text-[var(--text-secondary,#999999)]">Privacy</Link>
              <Link href="/terms" className="transition hover:text-[var(--text-secondary,#999999)]">Terms</Link>
              <Link href="/support" className="transition hover:text-[var(--text-secondary,#999999)]">Support</Link>
            </div>
          </div>
        </section>

        {/* Right Authentication Form Workspace */}
        <section className="relative flex min-h-[calc(100vh-61px)] flex-col justify-between px-4 py-8 sm:px-8 sm:py-12 lg:min-h-screen lg:px-12 xl:px-16">
          {/* Desktop Topbar with Theme Toggle */}
          <div className="hidden items-center justify-end lg:flex">
            <ThemeToggle />
          </div>

          {/* Center Form Wrapper */}
          <div className="my-auto w-full max-w-[440px] self-center py-4">
            {children}
          </div>

          {/* Mobile & Desktop Clean Bottom Footer */}
          <footer className="mt-8 flex flex-col items-center justify-between gap-3 text-center text-xs text-[var(--text-muted,#666666)] sm:flex-row sm:text-left">
            <span>© 2026 Qubira Platform</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="transition hover:text-[var(--text-secondary,#999999)]">Privacy Policy</Link>
              <span className="text-[var(--border-default,#292929)]">·</span>
              <Link href="/terms" className="transition hover:text-[var(--text-secondary,#999999)]">Terms of Service</Link>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
