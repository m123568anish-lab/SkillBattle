"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { X } from "lucide-react";
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

      <section
        className="
          flex-1
          overflow-auto
          p-4
          sm:p-8
          pb-28
          lg:pb-8
        "
      >
        <TopNavbar onMenuClick={() => setMobileMenuOpen(true)} />

        {children}

      </section>

      {/* Mobile glass-floating bottom navigation */}
      <div className="fixed inset-x-0 bottom-3 z-30 flex justify-center px-3 lg:hidden">
        <nav className="flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-slate-950/75 p-2 shadow-[0_20px_60px_rgba(8,145,178,0.25)] backdrop-blur-xl">
          {[
            { title: "Home", href: "/dashboard", icon: sidebarItems[0].icon },
            { title: "Battle", href: "/battle", icon: sidebarItems[1].icon },
            { title: "Rank", href: "/leaderboard", icon: sidebarItems[3].icon },
            { title: "Profile", href: "/profile", icon: sidebarItems[10].icon },
          ].map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.title}
                href={tab.href}
                className={`flex w-1/4 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                  active
                    ? "bg-gradient-to-b from-cyan-500/25 to-violet-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={18} />
                <span>{tab.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </main>
  );
}