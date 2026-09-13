"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { navigation } from "@/lib/navigation";

export default function MobileNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      {open && (
        <nav className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-white/10 bg-[#070B14] p-3 shadow-2xl">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white"
            >
              {item.name}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-2 py-2 text-center text-xs font-bold text-slate-300 hover:bg-white/10">Log in</Link>
            <Link href="/register" onClick={() => setOpen(false)} className="rounded-xl bg-cyan-500 px-2 py-2 text-center text-xs font-bold text-slate-950">Register</Link>
          </div>
        </nav>
      )}
    </div>
  );
}