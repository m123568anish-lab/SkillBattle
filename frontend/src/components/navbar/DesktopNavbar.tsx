"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/navigation";

export default function DesktopNavbar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-7">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`transition-all duration-200 ${
            pathname === item.href
              ? "border-b-2 border-[var(--accent)] py-2 text-[var(--text-primary)]"
              : "py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}