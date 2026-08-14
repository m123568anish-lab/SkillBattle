"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { sidebarCategories } from "@/data/dashboard";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      suppressHydrationWarning
      initial={false}
      animate={{ width: isCollapsed ? 88 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden lg:flex flex-col my-6 ml-6 rounded-3xl border border-white/10 bg-gradient-to-b from-[#0F172A] via-[#070B14] to-[#050816] backdrop-blur-2xl shadow-2xl shadow-black/50 relative overflow-hidden"
    >
      {/* Aurora Ambient Light */}
      <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

      {/* Collapse Button */}
      <button
        suppressHydrationWarning
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-3 top-6 z-20 rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition duration-200"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 p-6 relative z-10">
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-3 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 flex-shrink-0">
          <Trophy className="text-cyan-400 animate-pulse" size={24} />
        </div>

        {!isCollapsed && (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-black bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              SkillBattle
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-500/70">
              Arena
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto relative z-10 scrollbar-hide">
        <div className="p-4 space-y-5">
          {sidebarCategories.map((category) => (
            <div key={category.id}>
              {!isCollapsed && category.items.length > 0 && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"
                >
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-600 to-transparent" />
                  {category.label}
                </motion.h3>
              )}
              <div className="space-y-1.5 mt-2">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block relative group"
                      title={isCollapsed ? item.title : undefined}
                    >
                      <motion.div
                        suppressHydrationWarning
                        whileHover={{ x: 4 }}
                        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 relative overflow-hidden group ${
                          active
                            ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                            : "text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                        }`}
                      >
                        {/* Animated Background */}
                        {active && (
                          <motion.div
                            initial={false}
                            layoutId="activeNav"
                            className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 -z-10"
                          />
                        )}

                        <Icon
                          size={18}
                          className={`flex-shrink-0 ${
                            active ? "text-cyan-400" : "group-hover:text-slate-300"
                          }`}
                        />

                        {!isCollapsed && (
                          <motion.span
                            initial={false}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="font-semibold text-sm whitespace-nowrap flex-1"
                          >
                            {item.title}
                          </motion.span>
                        )}

                        {/* Active Indicator */}
                        {active && (
                          <motion.div
                            initial={false}
                            layoutId="activeDot"
                            className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer - Quick Action */}
      {!isCollapsed && (
        <div className="border-t border-white/5 p-4 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500/80 to-violet-500/80 px-4 py-2.5 font-bold text-sm text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition duration-200"
          >
            <Zap size={16} />
            Start Battle
          </motion.button>
        </div>
      )}
    </motion.aside>
  );
}
