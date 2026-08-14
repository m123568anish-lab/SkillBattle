import Link from "next/link";
import { Swords } from "lucide-react";

export default function NavLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/30">
        <Swords className="h-6 w-6 text-white" />
      </div>

      <span className="text-2xl font-bold tracking-wide text-white">
        SkillBattle
      </span>
    </Link>
  );
}