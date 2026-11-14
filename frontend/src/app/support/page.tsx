import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Mail } from "lucide-react";
import Footer from "@/components/Footer";
import QubiraLogo from "@/components/brand/QubiraLogo";

export const metadata: Metadata = {
  title: "Support | Qubira",
  description: "Find Qubira help and contact support.",
};

export default function SupportPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)] outline-none">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/" className="inline-block transition-opacity hover:opacity-90">
          <QubiraLogo variant="full" size="sm" />
        </Link>
        <section className="mt-10 overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-2xl sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">Support center</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">Answers when you need them.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            Start with the help center for common Qubira questions. If you still need assistance, email our support team with the details of your issue.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/faq"
              className="group rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-6 transition hover:border-[var(--accent-strong)] hover:bg-[var(--accent)]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <BookOpen className="text-[var(--accent-strong)]" size={24} aria-hidden="true" />
              <h2 className="mt-5 text-lg font-bold">Browse the help center</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Find guidance about accounts, learning paths, challenges, and career readiness.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent-strong)] group-hover:translate-x-0.5 transition-transform">
                View FAQs <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </Link>
            <a
              href="mailto:support@qubira.io?subject=Qubira%20support"
              className="group rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-6 transition hover:border-[var(--border-focus)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <Mail className="text-[var(--accent-strong)]" size={24} aria-hidden="true" />
              <h2 className="mt-5 text-lg font-bold">Email support</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Open your email client to contact the team through support@qubira.io.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent-strong)] group-hover:translate-x-0.5 transition-transform">
                Contact support <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </a>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
