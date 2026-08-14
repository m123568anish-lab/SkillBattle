"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  Code2,
  Flame,
  Gauge,
  Menu,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  X,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Battles", href: "#battles" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "How it works", href: "#process" },
];

const featureCards = [
  {
    icon: BrainCircuit,
    title: "AI-powered coaching",
    text: "Get instant hints, personalized feedback, and strategy tips as you solve real interview-style challenges.",
  },
  {
    icon: Trophy,
    title: "Skill-based matchmaking",
    text: "Face opponents at your level and climb the ladder through streaks, tournaments, and objective-based battles.",
  },
  {
    icon: ShieldCheck,
    title: "Career-focused training",
    text: "Turn daily practice into placements with structured tracks for coding, aptitude, and system design readiness.",
  },
];

const battleModes = [
  {
    title: "DSA Arena",
    difficulty: "Hard",
    players: "2,340 online",
    time: "20 min",
    reward: "+120 XP",
    accent: "from-cyan-500/20 to-blue-500/10",
  },
  {
    title: "Python Clash",
    difficulty: "Medium",
    players: "1,894 online",
    time: "15 min",
    reward: "+90 XP",
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    title: "SQL Duel",
    difficulty: "Medium",
    players: "982 online",
    time: "15 min",
    reward: "+80 XP",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    title: "Java League",
    difficulty: "Hard",
    players: "1,540 online",
    time: "25 min",
    reward: "+110 XP",
    accent: "from-amber-500/20 to-orange-500/10",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your profile",
    text: "Set your target role, skill level, and preferred battle tracks in under a minute.",
  },
  {
    number: "02",
    title: "Join a live challenge",
    text: "Match with players in real time and compete in coding, reasoning, or backend rounds.",
  },
  {
    number: "03",
    title: "Level up fast",
    text: "Earn XP, unlock badges, and track the exact areas where you need to improve next.",
  },
];

const leaderboard = [
  { name: "Aiden", score: "8,420 XP", badge: "#1" },
  { name: "Riya", score: "7,980 XP", badge: "#2" },
  { name: "Vikram", score: "7,360 XP", badge: "#3" },
];

export default function Home() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const goToBattle = () => router.push("/battle/solo");

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
              The next-gen coding arena
            </div>

            <h1 className="mt-8 max-w-xl text-4xl font-black leading-[0.96] tracking-[-0.05em] text-white sm:text-5xl lg:text-7xl">
              Learn fast.
              <span className="mt-2 block bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
                Battle smarter.
              </span>
              <span className="mt-2 block text-slate-100">Get hired.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Compete in real-time coding battles, sharpen your interview logic, and turn daily practice into measurable career momentum.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={goToBattle}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_rgba(59,130,246,0.35)] transition hover:translate-y-[-1px]"
              >
                Start free battle
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/battle")}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-base font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-white/10"
              >
                Watch demo
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/10 pt-8">
              {[
                { value: "10K+", label: "active coders" },
                { value: "4.9/5", label: "player rating" },
                { value: "89%", label: "skill improvement" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                </div>
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
                      <Swords className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Live arena</p>
                      <h2 className="text-lg font-bold text-white">DSA Challenge</h2>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    Live
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-white">Alex</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300">Lv. 24</p>
                  </div>

                  <div className="rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-xs font-black text-slate-200">
                    VS
                  </div>

                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                      <Zap className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-white">Rahul</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Lv. 27</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Problem</p>
                      <h3 className="mt-2 text-lg font-bold text-white">Reverse Linked List</h3>
                    </div>
                    <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1.5 text-sm font-bold text-cyan-300">
                      01:42
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-slate-300">Your progress</span>
                        <span className="font-bold text-cyan-300">78%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800">
                        <div className="h-2.5 w-[78%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-slate-300">Opponent progress</span>
                        <span className="font-bold text-rose-300">91%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800">
                        <div className="h-2.5 w-[91%] rounded-full bg-gradient-to-r from-rose-400 to-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Rank</p>
                    <p className="mt-2 text-2xl font-black text-white">#27</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">XP</p>
                    <p className="mt-2 text-2xl font-black text-white">15K</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Why players stay</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Built to make practice feel like progress.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
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
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Battle modes</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Choose your arena.
            </h2>
          </div>
          <Link
            href="/battle"
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40 hover:text-white"
          >
            Explore all battles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {battleModes.map(({ title, difficulty, players, time, reward, accent }) => (
            <div
              key={title}
              className={`rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${accent} p-[1px]`}
            >
              <div className="h-full rounded-[1.7rem] bg-[#09111d] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                    {difficulty}
                  </span>
                  <Flame className="h-4 w-4 text-amber-300" />
                </div>

                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Compete in real-time rounds built to test both speed and correctness under pressure.
                </p>

                <div className="mt-5 space-y-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Players</span>
                    <span className="font-semibold">{players}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Duration</span>
                    <span className="font-semibold">{time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Reward</span>
                    <span className="font-semibold text-emerald-300">{reward}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goToBattle}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Play now
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="process" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/80 to-[#101827] p-6 sm:p-8 lg:p-10">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">How it works</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Turn skill-building into a habit.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
                <div className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="leaderboard" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Leaderboard</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Top performers right now.</h2>

            <div className="mt-8 space-y-4">
              {leaderboard.map((player, index) => (
                <div
                  key={player.name}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#09111d] px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-sm font-black text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{player.name}</p>
                      <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Rank {player.badge}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">{player.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Player snapshot</p>
                <h3 className="text-xl font-black text-white">Your momentum</h3>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                  <span>Problem solving</span>
                  <span className="font-bold text-white">92%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800">
                  <div className="h-2.5 w-[92%] rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                  <span>Interview readiness</span>
                  <span className="font-bold text-white">87%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800">
                  <div className="h-2.5 w-[87%] rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500" />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                  <span>Consistency streak</span>
                  <span className="font-bold text-white">12 days</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800">
                  <div className="h-2.5 w-[76%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={goToBattle}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 text-sm font-bold text-white"
            >
              Track my growth
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">Begin your grind</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Start winning the interview game today.
              </h2>
            </div>

            <button
              type="button"
              onClick={goToBattle}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-bold text-slate-900 transition hover:scale-[1.01]"
            >
              Join SkillBattle
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}