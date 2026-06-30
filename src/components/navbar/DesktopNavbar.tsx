"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/navigation";

export default function DesktopNavbar() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center gap-8">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`transition-all duration-200 ${
            pathname === item.href
              ? "text-cyan-400"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}