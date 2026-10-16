"use client";

import { useEffect, useState } from "react";
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const portal = getPortalKind(pathname);
  const mobileNavigation = getMobileNavigation(portal);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname, searchParams]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href?: string) => {
    if (!href) return false;
    const [targetPath, query = ""] = href.split("?");
    const normalizedPath = pathname || "/";

    if (
      targetPath === "/dashboard" ||
      targetPath === "/college/dashboard" ||
      targetPath === "/company/dashboard" ||
      targetPath === "/admin"
    ) {
      if (query) {
        if (normalizedPath !== targetPath) return false;
        const targetParams = new URLSearchParams(query);
        return Array.from(targetParams.entries()).every(
          ([key, val]) => searchParams.get(key) === val
        );
      }
      if (searchParams.get("view") || searchParams.get("tab")) return false;
      return normalizedPath === targetPath;
    }

    if (query) {
      if (normalizedPath !== targetPath) return false;
      const targetParams = new URLSearchParams(query);
      return Array.from(targetParams.entries()).every(
        ([key, val]) => searchParams.get(key) === val
      );
    }

    return normalizedPath === targetPath || normalizedPath.startsWith(`${targetPath}/`);
  };

  return (
    <main suppressHydrationWarning className="flex min-h-screen bg-[#060913] text-white lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      {/* Desktop Persistent Responsive Sidebar */}
      <Sidebar />

      {/* Mobile Drawer (Left Slide-In) */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="relative h-full w-[82vw] max-w-xs shadow-2xl shadow-black bg-[#080d19] border-r border-white/10 flex flex-col"
            >
              <Sidebar isMobile onCloseMobile={() => setMobileDrawerOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <section className="min-w-0 flex-1 overflow-auto px-3 pb-24 pt-3 sm:px-6 sm:pb-8 sm:pt-5 lg:h-full lg:min-h-0 lg:px-8 lg:pt-6">
        <TopNavbar onOpenMobileNav={() => setMobileDrawerOpen(true)} />
        {children}
      </section>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.08] bg-[#0a0f1d]/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 backdrop-blur-xl lg:hidden shadow-2xl shadow-black">
        <div className="mx-auto flex h-12 max-w-xl items-center justify-around gap-1">
          {mobileNavigation.map((tab) => {
            const active = isActive(tab.href);
            if (!tab.available || !tab.href) {
              return (
                <button
                  key={tab.title}
                  type="button"
                  aria-label={tab.title}
                  onClick={() => setMobileDrawerOpen(true)}
                  className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[9px] font-semibold uppercase leading-none tracking-normal text-slate-400 hover:text-slate-200 transition"
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
                  active ? "scale-105 text-cyan-400 font-bold" : "text-slate-400 hover:text-slate-200"
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
