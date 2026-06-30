"use client";

import Link from "next/link";
import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Leaderboard", href: "#" },
  { name: "Battles", href: "#" },
  { name: "Tournaments", href: "#" },
  { name: "About", href: "#" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#070B14]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-violet-600 p-2">
            <Swords className="h-5 w-5 text-white" />
          </div>

          <span className="text-xl font-bold tracking-wide text-white">
            SkillBattle
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-cyan-400"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost">Login</Button>

          <Button className="bg-violet-600 hover:bg-violet-700">
            Start Battle
          </Button>
        </div>
      </div>
    </header>
  );
}