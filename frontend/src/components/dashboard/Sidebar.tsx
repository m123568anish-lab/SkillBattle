"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Trophy, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { getPortalCategories, getPortalKind } from "@/data/dashboard";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const portal = getPortalKind(pathname);
  const categories = getPortalCategories(portal);
  const BrandIcon = portal === "college" ? Trophy : portal === "company" ? Zap : Trophy;
  const portalLabel = portal === "college" ? "College" : portal === "company" ? "Hiring" : "Arena";
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href?: string) => {
    if (!href) return false;
    const [targetPath, query = ""] = href.split("?");
    if (pathname !== targetPath) return false;
    const targetParams = new URLSearchParams(query);
    const targetEntries = Array.from(targetParams.entries());
    const targetView = targetParams.get("view");
    const currentView = searchParams.get("view");
    if (targetView !== currentView) return false;
    return targetEntries.every(([key, value]) => searchParams.get(key) === value);
  };

  return (
    <motion.aside
      suppressHydrationWarning
      initial={false}
      animate={{ width: isCollapsed ? 88 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden lg:flex flex-col my-4 ml-4 rounded-[1.5rem] border border-white/[0.07] bg-[#090e19] shadow-xl shadow-black/30 relative overflow-hidden"
    >
      {/* Restrained Ambient Light */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-500/5 blur-3xl" />

      {/* Collapse Button */}
      <button
        suppressHydrationWarning
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
        className="absolute right-3 top-5 z-20 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-slate-400 transition hover:border-cyan-500/30 hover:text-cyan-300"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header */}
      <div className={`relative z-10 flex items-center gap-3 border-b border-white/[0.06] px-5 py-5 ${isCollapsed ? "justify-center" : "pr-12"}`}>
          <div className="flex-shrink-0 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5">
          <BrandIcon className="text-cyan-400" size={24} />
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
              {portalLabel}
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto relative z-10 scrollbar-hide">
        <div className="p-4 space-y-5">
          {categories.map((category) => (
            <div key={category.id}>
              {!isCollapsed && category.items.length > 0 && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600"
              >
                  {category.label}
                </motion.h3>
              )}
              <div className="mt-1 space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  if (!item.available || !item.href) {
                    return (
                      <div
                        key={item.title}
                        aria-disabled="true"
                        title="This workflow is not available in the backend yet."
                        className="flex items-center gap-3 rounded-xl border border-transparent px-4 py-2.5 text-slate-600"
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        {!isCollapsed && <span className="flex-1 text-sm font-medium">{item.title}</span>}
                        {!isCollapsed && <span className="text-[9px] uppercase text-slate-600">Unavailable</span>}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="block relative group"
                      title={isCollapsed ? item.title : undefined}
                    >
                      <motion.div
                        suppressHydrationWarning
                        whileHover={{ x: 4 }}
                        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 relative overflow-hidden group ${
                          active
                            ? "bg-cyan-400/[0.09] text-cyan-200 border border-cyan-300/15"
                            : "text-slate-400 border border-transparent hover:text-slate-100 hover:bg-white/[0.04]"
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
          <Link
            href={portal === "college" ? "/college/dashboard?view=students" : portal === "company" ? "/company/dashboard?view=jobs&action=create" : "/battle"}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
          >
            <Zap size={16} />
            {portal === "college" ? "Manage Students" : portal === "company" ? "Create Job" : "Start Battle"}
          </Link>
        </div>
      )}
    </motion.aside>
  );
}
