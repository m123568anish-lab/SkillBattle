"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { X, Home, Sword, Trophy, Users, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sidebarItems } from "@/data/dashboard";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div
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
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 top-0 z-50 w-72 bg-[#070B14] p-6 border-r border-white/10 md:hidden flex flex-col justify-between"
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
                <nav className="mt-6 space-y-1.5">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
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

      <main
        className="
          flex-1
          overflow-auto
          p-3
          sm:p-8
          px-4
          pb-[calc(6rem+env(safe-area-inset-bottom))]
          md:p-8
          md:pb-8
        "
      >
        <TopNavbar onMenuClick={() => setMobileMenuOpen(true)} />

        {children}

      </main>

      {/* Mobile navigation stays fixed while the content reserves its height. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center md:hidden">
        <nav
          aria-label="Mobile navigation"
          className="flex w-full max-w-lg items-center justify-between rounded-t-2xl border border-white/10 bg-slate-950/90 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_20px_60px_rgba(8,145,178,0.25)] backdrop-blur-xl"
        >
          {[
            { title: "Home", href: "/dashboard", icon: Home },
            { title: "Battle", href: "/battle", icon: Sword },
            { title: "Rank", href: "/leaderboard", icon: Trophy },
            { title: "Friends", href: "/social", icon: Users },
            { title: "More", href: "#more", icon: MoreHorizontal },
          ].map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            const className = `relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                  active
                    ? "bg-gradient-to-b from-cyan-500/25 to-violet-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`;
            if (tab.title === "More") {
              return (
                <button key={tab.title} type="button" onClick={() => setMobileMenuOpen(true)} className={className}>
                  <Icon size={18} />
                  <span>{tab.title}</span>
                </button>
              );
            }
            return (
              <Link key={tab.title} href={tab.href} className={className}>
                <Icon size={18} />
                <span>{tab.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}