"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  Code2,
  Flame,
  GraduationCap,
  Menu,
  ShieldCheck,
  Sparkles,
  Swords,
  Users,
  X,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Student", href: "#student" },
  { label: "College", href: "#college" },
  { label: "Company", href: "#company" },
  { label: "Battles", href: "#battles" },
];

const roleCards = [
  {
    label: "Student",
    icon: GraduationCap,
    title: "Learn. Practice. Battle. Improve.",
    text: "Build coding confidence through practice, AI guidance, rankings, and placement-ready skill development.",
    href: "/register?account_type=STUDENT",
    cta: "Explore Student Platform",
  },
  {
    label: "College",
    icon: Building2,
    title: "Assess. Track. Drive placements.",
    text: "Manage students, run assessments, and turn skill data into stronger placement outcomes for your campus.",
    href: "/register?account_type=COLLEGE",
    cta: "Explore College Platform",
  },
  {
    label: "Company",
    icon: BriefcaseBusiness,
    title: "Discover. Assess. Hire.",
    text: "Find talent, evaluate skills, and streamline hiring with a single platform designed for recruiters and teams.",
    href: "/register?account_type=COMPANY",
    cta: "Explore Hiring Platform",
  },
];

const featureCards = [
  {
    icon: BrainCircuit,
    title: "AI Coach",
    text: "Get guided feedback, recommendations, and learning support that adapts to the skill gap you are trying to close.",
  },
  {
    icon: Swords,
    title: "Battle Arena",
    text: "Practice under pressure with competitive coding rounds that test speed, reasoning, and problem-solving ability.",
  },
  {
    icon: ShieldCheck,
    title: "Skill Profile",
    text: "Track progress, monitor readiness, and create a clearer story around the skills that matter for placement and hiring.",
  },
  {
    icon: Users,
    title: "Placement Ecosystem",
    text: "Connect the student journey from learning and assessment to college visibility and company discovery.",
  },
];

const battleSteps = [
  {
    number: "01",
    title: "Practice skills",
    text: "Sharpen coding, logic, and interview readiness with targeted learning experiences.",
  },
  {
    number: "02",
    title: "Enter battle",
    text: "Join live coding rounds and test your ability under time pressure and real challenge conditions.",
  },
  {
    number: "03",
    title: "Improve skill profile",
    text: "Use your performance data to focus on priority areas and improve your readiness for opportunities.",
  },
];

const ecosystemFlow = [
  "Student practice",
  "Battle performance",
  "Assessment insights",
  "Skill profile",
  "College / Company visibility",
  "Placement readiness",
];

export default function Home() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const goToBattle = () => router.push("/battle");

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-5%] top-20 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/65 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500 to-violet-600 shadow-[0_0_22px_rgba(34,211,238,0.35)]">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">SkillBattle</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.45)] transition hover:scale-[1.01]"
            >
              Start now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 md:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#050816]/95 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-100"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Start now
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <section id="home" className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.12)]">
              <Sparkles className="h-3.5 w-3.5" />
              Students • Colleges • Companies
            </div>

            <h1 className="mt-8 max-w-xl text-4xl font-black leading-[0.96] tracking-[-0.05em] text-white sm:text-5xl lg:text-7xl">
              Learn.
              <span className="mt-2 block bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
                Practice.
              </span>
              <span className="mt-2 block text-slate-100">Compete. Get placement ready.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              SkillBattle connects students, colleges, and companies through coding practice, assessments, AI guidance, and competitive learning designed for real-world placement preparation.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_rgba(59,130,246,0.35)] transition hover:translate-y-[-1px]"
              >
                Start your journey
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/battle"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-base font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-white/10"
              >
                Explore SkillBattle
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-8">
              {[
                "AI-guided learning",
                "Career-focused practice",
                "Placement-ready assessments",
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-cyan-500/15 via-violet-500/20 to-fuchsia-500/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_40px_120px_rgba(15,23,42,0.9)] backdrop-blur-xl sm:p-6">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#0a1225]/90 p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Platform flow</p>
                      <h2 className="text-lg font-bold text-white">SkillBattle ecosystem</h2>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Live
                  </div>
                </div>

                <div className="space-y-3">
                  {ecosystemFlow.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-xs font-black text-white">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">Built for</p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    Students preparing for real opportunities, colleges improving placement readiness, and companies identifying stronger candidate pipelines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="student" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Role-based entry</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            One platform for each stage of the journey.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {roleCards.map(({ label, icon: Icon, title, text, href, cta }) => (
            <div
              key={label}
              className="group rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-slate-900/60"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-cyan-300 ring-1 ring-cyan-400/20">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <h3 className="mt-3 text-xl font-bold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
              <Link
                href={href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                {cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Real product features</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Built around how the platform actually works.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-slate-900/60"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-cyan-300 ring-1 ring-cyan-400/20">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="battles" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Competitive learning</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Practice skills. Enter a battle. Improve faster.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {battleSteps.map((step) => (
            <div key={step.number} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={goToBattle}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_rgba(59,130,246,0.35)] transition hover:translate-y-[-1px]"
          >
            Explore battles
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/leaderboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-base font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-white/10"
          >
            View leaderboard
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/80 to-[#101827] p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">AI assistance</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Smart support without replacing the human journey.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
                SkillBattle uses AI to support learning, coaching, and readiness workflows. It helps students improve and gives colleges and companies clearer insight into candidate preparation without replacing human judgment.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-cyan-400/20 bg-cyan-500/10 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">AI capabilities</p>
                  <h3 className="text-xl font-bold text-white">Learning support</h3>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />AI guidance for practice and improvement</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-violet-400" />Roadmap and learning recommendations</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-fuchsia-400" />Assessment and candidate readiness support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Placement ecosystem</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            From skills to opportunities.
          </h2>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[
              "Student",
              "Skills",
              "Practice",
              "Assessment",
              "Skill profile",
              "College / Company",
            ].map((item, index) => (
              <div
                key={item}
                className="flex flex-col items-center justify-center rounded-[1.5rem] border border-white/10 bg-[#09111d] px-4 py-6 text-center"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-sm font-black text-white">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold text-slate-200">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <Flame className="h-4 w-4" />
              Ready for placement preparation and hiring workflows
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Get started</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Build your next step in SkillBattle.
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-bold text-slate-900 transition hover:scale-[1.01]"
              >
                Join now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/college/register"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-base font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-white/10"
              >
                College signup
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}