"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { navigation } from "@/lib/navigation";
import AuthControls from "./AuthControls";
import { ThemeToggle } from "@/components/common/ExperienceEnhancements";

export default function MobileNavbar() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className="relative flex items-center gap-2 lg:hidden">
      <ThemeToggle />
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="public-navbar-mobile-menu"
        onClick={() => setOpen((value) => !value)}
        className="text-[var(--text-primary)]"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      {open && (
        <nav id="public-navbar-mobile-menu" aria-label="Mobile navigation" className="absolute right-0 top-14 z-50 w-56 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-3 shadow-2xl">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
            >
              {item.name}
            </Link>
          ))}
          <div className="mt-2 border-t border-[var(--border-default)] pt-3">
            <AuthControls compact />
          </div>
        </nav>
      )}
    </div>
  );
}
