"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/navigation";

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-8 lg:flex">
      {navigation.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`transition duration-200 ${
              active
                ? "text-cyan-400"
                : "text-slate-300 hover:text-white"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}