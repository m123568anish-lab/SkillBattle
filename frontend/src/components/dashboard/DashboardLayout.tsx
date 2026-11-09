"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { motion, AnimatePresence } from "framer-motion";
import { getMobileNavigation, getPortalKind } from "@/data/dashboard";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import GridBackground from "@/components/background/GridBackground";
import PageTransition from "@/components/common/PageTransition";
import { MOTION_DURATIONS } from "@/lib/motion";

interface Props {
  children: React.ReactNode;
}

function DashboardLayoutInner({ children }: Props) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [textEntryFocused, setTextEntryFocused] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const portal = getPortalKind(pathname);
  const mobileNavigation = getMobileNavigation(portal);
  const reduceMotion = useReducedMotion();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname, searchParams]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [mobileDrawerOpen]);

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLElement>("[data-drawer-close]")?.focus();
    const getFocusableElements = () => drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusableElements();
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !drawer?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [mobileDrawerOpen]);

  useEffect(() => {
    const updateTextEntryFocus = () => {
      const activeElement = document.activeElement;
      const isEditableInput = activeElement instanceof HTMLInputElement
        && !activeElement.readOnly
        && !["button", "checkbox", "radio", "reset", "submit"].includes(activeElement.type);
      setTextEntryFocused(
        isEditableInput ||
        (activeElement instanceof HTMLTextAreaElement && !activeElement.readOnly) ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable)
      );
    };
    const handleFocusOut = () => window.requestAnimationFrame(updateTextEntryFocus);
    document.addEventListener("focusin", updateTextEntryFocus);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", updateTextEntryFocus);
      document.removeEventListener("focusout", handleFocusOut);
    };
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

  const hideDock = textEntryFocused || (portal === "student" && (
    (pathname === "/tasks" && searchParams.has("problem")) ||
    pathname === "/battle/company-speedrun" ||
    (pathname.startsWith("/battle/") && !["/battle/solo", "/battle/lobby", "/battle/new", "/battle/queue", "/battle/waiting", "/battle/create"].includes(pathname))
  ));

  return (
    <main suppressHydrationWarning className="relative flex min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)] lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      {/* Ambient Background System */}
      <GridBackground />

      {/* Desktop Persistent Responsive Sidebar */}
      <Sidebar />

      {/* Mobile Drawer (Left Slide-In) */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileDrawerOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : MOTION_DURATIONS.fast }}
              className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-sm"
            />

            {/* Drawer Panel */}
            <motion.div
              ref={drawerRef}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", damping: 28, stiffness: 280 }
              }
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              tabIndex={-1}
              className="relative z-10 h-full w-[min(86vw,22rem)] shadow-2xl shadow-black"
            >
              <Sidebar isMobile onCloseMobile={() => setMobileDrawerOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <section
        id="main-content"
        tabIndex={-1}
        className="relative z-10 min-w-0 flex-1 overflow-auto bg-transparent px-3 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-3 outline-none sm:px-6 sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pt-5 lg:h-full lg:min-h-0 lg:px-10 lg:pb-10 lg:pt-7"
      >
        <TopNavbar onOpenMobileNav={() => setMobileDrawerOpen(true)} />
        <PageTransition>{children}</PageTransition>
      </section>

      {/* Mobile Bottom Navigation Bar */}
      {!hideDock && (
        <nav
          aria-label="Primary mobile navigation"
          className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[30rem] -translate-x-1/2 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)]/90 px-2 py-1.5 shadow-2xl backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto flex h-12 items-center justify-around gap-0.5">
            {mobileNavigation.map((tab) => {
              const active = isActive(tab.href);
              if (!tab.available || !tab.href) {
                return (
                  <button
                    key={tab.title}
                    type="button"
                    aria-label={tab.title}
                    onClick={() => setMobileDrawerOpen(true)}
                    className="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[9px] font-semibold leading-none tracking-normal text-[var(--text-muted)] transition hover:text-[var(--text-primary)] motion-reduce:transition-none"
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
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[9px] font-semibold leading-none tracking-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] motion-reduce:transition-none ${
                    active
                      ? "text-[var(--accent-strong)] font-bold"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mobile-dock-active"
                      className="absolute inset-0 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 pointer-events-none"
                      transition={{ type: "spring", damping: 28, stiffness: 320 }}
                    />
                  )}
                  <tab.icon size={19} strokeWidth={active ? 2.5 : 2} className="relative z-10" />
                  <span className="relative z-10 max-w-full truncate">{tab.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </main>
  );
}

export default function DashboardLayout({ children }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface-canvas)] text-[var(--text-secondary)]">
          <div className="flex items-center gap-3 text-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            Loading workspace…
          </div>
        </div>
      }
    >
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
