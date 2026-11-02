import Link from "next/link";
import { QubiraLogo } from "@/components/brand/QubiraLogo";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050816]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <QubiraLogo variant="full" size="sm" showTagline />
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm">
          <Link href="/#home" className="transition hover:text-white">Home</Link>
          <Link href="/practice" className="transition hover:text-white">Qubira Learn</Link>
          <Link href="/battle" className="transition hover:text-white">Qubira Arena</Link>
          <Link href="/leaderboard" className="transition hover:text-white">Qubira Rankings</Link>
          <Link href="/faq" className="transition hover:text-white">Help & FAQ</Link>
          <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
          <Link href="/terms" className="transition hover:text-white">Terms</Link>
          <Link href="/login" className="transition hover:text-white">Log in</Link>
          <Link href="/register" className="transition hover:text-white">Register</Link>
          <a href="mailto:support@qubira.io" className="transition hover:text-white">support@qubira.io</a>
        </div>

        <p className="text-xs text-slate-500">© 2026 QUBIRA. Learn. Build. Compete.</p>
      </div>
    </footer>
  );
}
