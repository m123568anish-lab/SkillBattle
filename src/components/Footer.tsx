import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050816]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-sm font-black text-white">
            S
          </div>
          <span className="font-semibold text-slate-200">SkillBattle</span>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <Link href="#home" className="transition hover:text-white">Home</Link>
          <Link href="#features" className="transition hover:text-white">Features</Link>
          <Link href="#battles" className="transition hover:text-white">Battles</Link>
          <Link href="/leaderboard" className="transition hover:text-white">Leaderboard</Link>
        </div>

        <p className="text-slate-400">© 2026 SkillBattle. Practice. Compete. Advance.</p>
      </div>
    </footer>
  );
}
