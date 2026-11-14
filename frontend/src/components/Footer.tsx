import Link from "next/link";
import { QubiraLogo } from "@/components/brand/QubiraLogo";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-default)] bg-[var(--surface-canvas)] text-[var(--text-secondary)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-[var(--text-secondary)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <QubiraLogo variant="full" size="sm" showTagline />
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm">
          <Link href="/#home" className="transition hover:text-[var(--text-primary)]">Home</Link>
          <Link href="/practice" className="transition hover:text-[var(--text-primary)]">Qubira Learn</Link>
          <Link href="/battle" className="transition hover:text-[var(--text-primary)]">Qubira Arena</Link>
          <Link href="/leaderboard" className="transition hover:text-[var(--text-primary)]">Qubira Rankings</Link>
          <Link href="/faq" className="transition hover:text-[var(--text-primary)]">Help & FAQ</Link>
          <Link href="/privacy" className="transition hover:text-[var(--text-primary)]">Privacy</Link>
          <Link href="/terms" className="transition hover:text-[var(--text-primary)]">Terms</Link>
          <Link href="/login" className="transition hover:text-[var(--text-primary)]">Log in</Link>
          <Link href="/register" className="transition hover:text-[var(--text-primary)]">Register</Link>
          <a href="mailto:support@qubira.io" className="transition hover:text-[var(--text-primary)]">support@qubira.io</a>
        </div>

        <p className="text-xs text-[var(--text-muted)]">© 2026 QUBIRA. Learn. Build. Compete.</p>
      </div>
    </footer>
  );
}
