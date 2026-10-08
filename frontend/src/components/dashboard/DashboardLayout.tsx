"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getMobileNavigation, getPortalKind, sidebarItems } from "@/data/dashboard";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const portal = getPortalKind(pathname);
  const mobileNavigation = getMobileNavigation(portal);

  const quickAccessGroups = (() => {
    const categoryTitles: Record<string, string> = {
      main: "Core",
      compete: "Compete",
      learn: "Grow",
      track: "Track",
      account: "Account",
    };

    const itemsByCategory = new Map<string, Array<{ label: string; href: string }>>();

    for (const item of sidebarItems) {
      const groupTitle = categoryTitles[item.category] ?? "Explore";
      const targetHref = item.href || "/dashboard";
      const existing = itemsByCategory.get(groupTitle) ?? [];
      if (!existing.some((entry) => entry.href === targetHref)) {
        existing.push({ label: item.title, href: targetHref });
      }
      itemsByCategory.set(groupTitle, existing);
    }

    if (portal === "college") {
      return [
        {
          title: "Workspaces",
          items: [
            { label: "Students", href: "/college/dashboard?view=students" },
            { label: "Assessments", href: "/college/dashboard?view=assessments" },
            { label: "Placement", href: "/placement" },
            { label: "Analytics", href: "/college/dashboard?view=analytics" },
          ],
        },
        {
          title: "Organization",
          items: [
            { label: "College Profile", href: "/organization-setup" },
            { label: "Settings", href: "/settings" },
          ],
        },
      ];
    }

    if (portal === "company") {
      return [
        {
          title: "Talent",
          items: [
            { label: "Jobs", href: "/company/dashboard?view=jobs" },
            { label: "Candidates", href: "/company/dashboard?view=candidates" },
            { label: "Interviews", href: "/company/dashboard?view=interviews" },
            { label: "Analytics", href: "/company/dashboard?view=analytics" },
          ],
        },
        {
          title: "Company",
          items: [
            { label: "Company Profile", href: "/organization-setup" },
            { label: "Settings", href: "/settings" },
          ],
        },
      ];
    }

    return Array.from(itemsByCategory.entries()).map(([title, items]) => ({
      title,
      items: items.slice(0, 6),
    }));
  })();

  const isActive = (href?: string) => {
    if (!href) return false;
    const [targetPath, query = ""] = href.split("?");
    const normalizedPath = pathname || "/";

    if (targetPath === "/") {
      return normalizedPath === "/";
    }

    const pathMatches = normalizedPath === targetPath || normalizedPath.startsWith(`${targetPath}/`);
    if (!pathMatches) return false;

    const targetParams = new URLSearchParams(query);
    if (targetParams.get("view") !== searchParams.get("view")) return false;
    return Array.from(targetParams.entries()).every(([key, value]) => searchParams.get(key) === value);
  };

  return (
    <main suppressHydrationWarning className="flex min-h-screen bg-[#050816] text-white lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <Sidebar />

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close quick access"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-[28px] border border-white/10 bg-[#070B14] p-5 shadow-2xl shadow-black/60 lg:hidden"
            >
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/15" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-black text-white">Quick access</h2>
                <button
                  type="button"
                  aria-label="Close quick access"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-full border border-white/10 p-2 text-slate-300"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-5">
                {quickAccessGroups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">{group.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200 transition hover:border-cyan-500/30 hover:bg-cyan-500/5"
                        >
                          <span>{item.label}</span>
                          <span className="text-cyan-300">→</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section className="min-w-0 flex-1 overflow-auto p-3 pb-24 sm:p-8 lg:h-full lg:min-h-0 lg:pb-8">
        <TopNavbar />
        {children}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#070B14]/90 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex h-12 max-w-xl items-center justify-around gap-1">
          {mobileNavigation.map((tab) => {
            const active = isActive(tab.href);
            if (!tab.available || !tab.href) {
              return (
                <button
                  key={tab.title}
                  type="button"
                  aria-label={tab.title}
                  onClick={() => setMoreOpen(true)}
                  className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[9px] font-semibold uppercase leading-none tracking-normal text-slate-400"
                >
                  <tab.icon size={20} />
                  <span>{tab.title}</span>
                </button>
              );
            }
            return (
              <Link
                key={tab.title}
                href={tab.href}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[9px] font-semibold uppercase leading-none tracking-normal transition ${
                  active ? "scale-105 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <tab.icon size={20} />
                <span className="max-w-full truncate">{tab.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
