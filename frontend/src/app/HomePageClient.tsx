"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { QubiraLogo } from "@/components/brand/QubiraLogo";
import { ThemeToggle } from "@/components/common/ExperienceEnhancements";
import {
  ArrowDownRight,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Code2,
  GraduationCap,
  Menu,
  Swords,
  X,
} from "lucide-react";

const audiences = [
  {
    id: "students",
    number: "01",
    title: "For students",
    heading: "Build proof, not just plans.",
    text: "Practice technical skills, prepare for interviews, and show what you can do through real work.",
    href: "/register?account_type=STUDENT",
    link: "Explore the student experience",
    icon: GraduationCap,
  },
  {
    id: "colleges",
    number: "02",
    title: "For colleges",
    heading: "Bring progress into focus.",
    text: "Coordinate learning and assessments with a clearer view of student readiness.",
    href: "/register?account_type=COLLEGE",
    link: "Explore the campus workspace",
    icon: Building2,
  },
  {
    id: "companies",
    number: "03",
    title: "For companies",
    heading: "Meet skills with evidence.",
    text: "Discover candidates and run structured evaluations through a workspace built for hiring teams.",
    href: "/register?account_type=COMPANY",
    link: "Explore the hiring workspace",
    icon: BriefcaseBusiness,
  },
];

const experiences = [
  {
    number: "A",
    label: "Practice",
    title: "Make the fundamentals stick.",
    text: "Work through coding tasks and focused challenges at your own pace.",
    href: "/practice",
    icon: Code2,
  },
  {
    number: "B",
    label: "Compete",
    title: "Think clearly under pressure.",
    text: "Enter coding battles and test your problem-solving in a live arena.",
    href: "/battle",
    icon: Swords,
  },
  {
    number: "C",
    label: "Reflect",
    title: "Turn effort into direction.",
    text: "Use your profile and coaching tools to decide what to strengthen next.",
    href: "/coach",
    icon: BrainCircuit,
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  return (
    <main id="main-content" className="min-h-screen overflow-x-clip bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border-default)] bg-[var(--surface-canvas)]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <QubiraLogo variant="full" size="sm" href="/" />

          <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
            <a href="#approach" className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">Approach</a>
            <a href="#students" className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">Students</a>
            <a href="#colleges" className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">Colleges</a>
            <a href="#companies" className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">Companies</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden min-h-10 items-center px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] lg:inline-flex">
              Log in
            </Link>
            <Link href="/register" className="hidden min-h-10 items-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-bold text-[var(--text-on-accent)] transition hover:brightness-95 lg:inline-flex">
              Get started <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <button ref={menuButtonRef} type="button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} aria-controls="public-mobile-navigation" onClick={() => setMobileMenuOpen((open) => !open)} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border-default)] text-[var(--text-primary)] lg:hidden">
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav id="public-mobile-navigation" aria-label="Mobile navigation" className="grid gap-1 border-t border-[var(--border-default)] bg-[var(--surface-card)] p-3 lg:hidden">
            {[
              ["Approach", "#approach"],
              ["Students", "#students"],
              ["Colleges", "#colleges"],
              ["Companies", "#companies"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center rounded-md px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]">{label}</a>
            ))}
            <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-default)] pt-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center justify-center rounded-md border border-[var(--border-default)] text-sm font-semibold">Log in</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] text-sm font-bold text-[var(--text-on-accent)]">Get started</Link>
            </div>
          </nav>
        )}
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
            <span className="h-px w-8 bg-[var(--accent-strong)]" />
            A skill platform for what comes next
          </p>
          <h1 className="mt-7 max-w-3xl font-semibold leading-[0.98] tracking-[-0.055em] text-[clamp(3.2rem,8vw,6.8rem)]">
            Make your next move <span className="font-serif italic text-[var(--accent-strong)]">count.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg sm:leading-8">
            Build technical ability through practice, sharpen it in competition, and make your progress visible when opportunity arrives.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/register" className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[var(--accent)] px-5 text-sm font-bold text-[var(--text-on-accent)] transition hover:brightness-95">
              Start building <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <a href="#approach" className="inline-flex min-h-12 items-center gap-2 px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
              See how it works <ArrowDownRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-[var(--border-default)] pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            <span>Practice with purpose</span>
            <span>Compete with intent</span>
            <span>Progress with evidence</span>
          </div>
        </div>

        <div className="relative min-w-0 border-y border-[var(--border-default)] py-5 sm:py-7">
          <div aria-hidden="true" className="absolute inset-y-0 left-[2.4rem] w-px bg-[var(--border-default)] sm:left-[3.1rem]" />
          <p className="mb-6 pl-[4.5rem] text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] sm:pl-20">The Qubira loop</p>
          <ol className="space-y-2">
            {experiences.map(({ number, label, title, text, href, icon: Icon }) => (
              <li key={number}>
                <Link href={href} className="group relative grid grid-cols-[3.5rem_1fr_auto] items-start gap-4 rounded-lg px-2 py-4 transition hover:bg-[var(--surface-card)] sm:grid-cols-[4.5rem_1fr_auto] sm:px-3">
                  <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-canvas)] text-xs font-bold text-[var(--accent-strong)] sm:h-12 sm:w-12">{number}</span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.17em] text-[var(--text-muted)]">{label}</span>
                    <span className="mt-1 block text-base font-semibold leading-snug text-[var(--text-primary)] sm:text-lg">{title}</span>
                    <span className="mt-1.5 block max-w-sm text-sm leading-6 text-[var(--text-secondary)]">{text}</span>
                  </span>
                  <Icon aria-hidden="true" className="mt-1 h-5 w-5 text-[var(--text-muted)] transition group-hover:text-[var(--accent-strong)]" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="approach" className="border-y border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">One journey, clear stages</p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">Learn by doing. Grow by showing.</h2>
          </div>
          <div className="grid gap-0 sm:grid-cols-3">
            {experiences.map((item, index) => (
              <div key={item.number} className={`py-5 sm:px-5 sm:py-1 ${index ? "border-t border-[var(--border-default)] sm:border-l sm:border-t-0" : ""}`}>
                <span className="text-xs font-bold text-[var(--text-muted)]">{item.number}</span>
                <h3 className="mt-4 text-lg font-semibold">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">Designed around your role</p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">The right workspace for every next step.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[var(--text-secondary)]">Students, colleges, and companies share a connected skills ecosystem—with dedicated workflows for each.</p>
        </div>
        <div className="grid border-y border-[var(--border-default)] lg:grid-cols-3">
          {audiences.map(({ id, number, title, heading, text, href, link, icon: Icon }, index) => (
            <article id={id} key={id} className={`flex min-h-72 flex-col py-7 sm:py-8 lg:px-7 ${index ? "border-t border-[var(--border-default)] lg:border-l lg:border-t-0" : "lg:pl-0"} ${index < audiences.length - 1 ? "lg:border-r" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-[0.15em] text-[var(--text-muted)]">{number} / {title}</span>
                <Icon className="h-5 w-5 text-[var(--accent-strong)]" aria-hidden="true" />
              </div>
              <h3 className="mt-8 max-w-xs text-2xl font-semibold leading-tight tracking-[-0.03em]">{heading}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">{text}</p>
              <Link href={href} className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]">
                {link} <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 sm:px-6 sm:pb-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-10">
        <div className="border-l-4 border-[var(--accent)] py-2 pl-6 sm:pl-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">Start where you are</p>
          <h2 className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">The best next step is a real one.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[var(--text-secondary)]">Choose a practice session, explore your workspace, or step into the arena.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { name: "Practice", href: "/practice", icon: Code2 },
            { name: "Arena", href: "/battle", icon: Swords },
            { name: "AI Coach", href: "/coach", icon: BrainCircuit },
          ].map(({ name, href, icon: Icon }) => (
            <Link key={name} href={href} className="group flex min-h-28 items-center justify-between border border-[var(--border-default)] bg-[var(--surface-card)] p-4 transition hover:border-[var(--accent-strong)] sm:block sm:min-h-36 sm:p-5">
              <span className="flex items-center gap-3 text-sm font-semibold sm:block">
                <Icon className="h-5 w-5 text-[var(--accent-strong)] sm:mb-5" aria-hidden="true" />
                {name}
              </span>
              <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--accent-strong)]" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <QubiraLogo variant="full" size="sm" href="/" />
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]">
            <Link href="/about" className="hover:text-[var(--text-primary)]">About</Link>
            <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)]">Terms</Link>
            <Link href="/support" className="hover:text-[var(--text-primary)]">Support</Link>
          </nav>
          <p className="text-xs text-[var(--text-muted)]">Learn. Build. Compete.</p>
        </div>
      </footer>
    </main>
  );
}
