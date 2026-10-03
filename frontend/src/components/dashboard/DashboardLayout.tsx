"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getMobileNavigation, getPortalCategories, getPortalKind } from "@/data/dashboard";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const portal = getPortalKind(pathname);
  const categories = getPortalCategories(portal);
  const mobileNavigation = getMobileNavigation(portal);

  const isActive = (href?: string) => {
    if (!href) return false;
    const [targetPath, query = ""] = href.split("?");
    if (pathname !== targetPath) return false;
    const targetParams = new URLSearchParams(query);
    if (targetParams.get("view") !== searchParams.get("view")) return false;
    return Array.from(targetParams.entries()).every(([key, value]) => searchParams.get(key) === value);
  };

  return (
    <main
      suppressHydrationWarning
      className="
        flex
        min-h-screen
        bg-[#050816]
        text-white
      "
    >
      <Sidebar />

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 top-0 z-50 w-72 bg-[#070B14] p-6 border-r border-white/10 lg:hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <span className="text-xl font-black bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                    SkillBattle
                  </span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg border border-white/10 p-1 text-slate-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
                <nav className="mt-6 max-h-[calc(100dvh-9rem)] space-y-1.5 overflow-y-auto">
                  {categories.flatMap((category) => category.items).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    if (!item.available || !item.href) {
                      return (
                        <div key={item.title} aria-disabled="true" className="flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm text-slate-600">
                          <Icon size={18} />
                          <span className="flex-1">{item.title}</span>
                          <span className="text-[9px] uppercase">Unavailable</span>
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon size={18} />
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section
        className="
          flex-1
          overflow-auto
          p-4
          sm:p-8
          pb-24
          lg:pb-8
        "
      >
        <TopNavbar onMenuClick={() => setMobileMenuOpen(true)} />

        {children}

      </section>

      {/* Mobile Sticky Bottom Navigation Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-white/10 bg-[#070B14]/90 p-3 backdrop-blur-lg flex justify-around items-center">
        {mobileNavigation.map((tab) => {
          const active = isActive(tab.href);
          if (!tab.available || !tab.href) {
            return (
              <span key={tab.title} aria-disabled="true" className="flex flex-col items-center gap-1 text-[10px] font-bold uppercase text-slate-600">
                <tab.icon size={20} />
                <span>{tab.title}</span>
              </span>
            );
          }
          return (
            <Link
              key={tab.title}
              href={tab.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wider uppercase transition ${
                active ? "text-cyan-400 scale-105" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.title}</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}