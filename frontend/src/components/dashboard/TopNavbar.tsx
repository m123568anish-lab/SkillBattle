"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import api from "@/services/api";
import NotificationMenu from "./NotificationMenu";
import ActivityMenu from "./ActivityMenu";
import ProfileMenu from "./ProfileMenu";
import { useAuthStore } from "@/store/authStore";
import { getDashboardPath } from "@/lib/auth-routing";
import { ThemeToggle } from "@/components/common/ExperienceEnhancements";
import QubiraLogo, { QubiraIcon } from "@/components/brand/QubiraLogo";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion";

type SearchResult = {
  type: string;
  title: string;
  detail: string;
  href: string;
};

export default function TopNavbar({
  onToggleMobileNav,
  mobileNavExpanded = false,
}: {
  onToggleMobileNav?: () => void;
  mobileNavExpanded?: boolean;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const pageLabel = pathname
    .split("/")
    .filter(Boolean)
    .slice(-1)[0]
    ?.replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Dashboard";

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobileSearchOpen(true);
        setSearchOpen(true);
        window.requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return;

    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await api.get<{ results: SearchResult[] }>("/search", {
          params: { q: query, limit: 5 },
          signal: controller.signal,
        });
        if (active) {
          const uniqueResults = response.data.results.filter((result, index, results) => (
            results.findIndex((candidate) => `${candidate.type}:${candidate.href}:${candidate.title}` === `${result.type}:${result.href}:${result.title}`) === index
          ));
          setSearchResults(uniqueResults);
          setSearchError(false);
        }
      } catch {
        if (active && !controller.signal.aborted) setSearchError(true);
      } finally {
        if (active) setSearching(false);
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const logoHref = user ? getDashboardPath(user) : "/login";

  return (
    <motion.header
      suppressHydrationWarning
      initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATIONS.fast * 1.5, ease: MOTION_EASINGS.command }}
      className="
        sticky top-0 z-20
        -mx-4 mb-5 flex min-h-14 min-w-0 flex-row items-center justify-between gap-1.5 border-b
        border-[#252525] bg-[#050505] px-4 py-2.5
        transition-colors duration-200
        sm:mx-0 sm:mb-8 sm:min-h-16 sm:gap-4 sm:px-0 sm:py-4
      "
    >
      {/* Subtle Bottom Border Accent Line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent"
      />

      <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
        {onToggleMobileNav ? (
          <button
            type="button"
            onClick={onToggleMobileNav}
            aria-label={mobileNavExpanded ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileNavExpanded}
            aria-controls="mobile-navigation-drawer"
            data-mobile-menu-trigger
            title={mobileNavExpanded ? "Close navigation menu" : "Open navigation menu"}
            className={`group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] sm:hidden ${
              mobileNavExpanded
                ? "border-[var(--accent)]/50 bg-[var(--accent)]/10"
                : "border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--accent)]/50"
            }`}
          >
            <QubiraIcon size={28} />
          </button>
        ) : null}
        <Link
          href={logoHref}
          aria-label="Go to your Qubira dashboard"
          title="Dashboard"
          className="inline-flex min-w-0 shrink-0 items-center px-1 py-1 text-left transition hover:opacity-90"
        >
          {onToggleMobileNav ? (
            <>
              <span className="inline-flex sm:hidden">
                <QubiraLogo variant="wordmark" size="sm" />
              </span>
              <span className="hidden sm:inline-flex">
                <QubiraLogo variant="full" size="sm" className="drop-shadow-[0_0_20px_rgba(216,255,62,0.08)]" />
              </span>
            </>
          ) : (
            <QubiraLogo variant="full" size="sm" className="drop-shadow-[0_0_20px_rgba(216,255,62,0.08)]" />
          )}
        </Link>

        {/* Global Search Input Bar & Command Palette */}
        <div
          className={`relative min-w-0 flex-1 lg:max-w-md ${
            mobileSearchOpen
              ? "max-sm:absolute max-sm:left-0 max-sm:right-0 max-sm:top-[calc(100%+0.5rem)] max-sm:z-50 max-sm:rounded-xl max-sm:border max-sm:border-[var(--border-default)] max-sm:bg-[var(--surface-elevated)] max-sm:p-2 max-sm:shadow-2xl"
              : "max-sm:hidden"
          } sm:block`}
        >
          <div className="group/search flex w-full items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 transition-all duration-200 focus-within:border-[var(--accent)]/60 focus-within:shadow-[0_0_16px_rgba(200,239,114,0.12)] sm:gap-3 sm:px-4 sm:py-2.5">
            <Search
              size={17}
              className="shrink-0 text-[var(--text-muted)] transition-colors duration-200 group-focus-within/search:text-[var(--accent-strong)]"
            />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => {
                const value = event.target.value;
                setSearchQuery(value);
                setSearchResults([]);
                setSearchError(false);
                setSearching(value.trim().length >= 2);
                setHighlightedIndex(0);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSearchOpen(false);
                  setMobileSearchOpen(false);
                }
                if (event.key === "ArrowDown" && searchResults.length) {
                  event.preventDefault();
                  setHighlightedIndex((index) => (index + 1) % searchResults.length);
                }
                if (event.key === "ArrowUp" && searchResults.length) {
                  event.preventDefault();
                  setHighlightedIndex((index) => (index - 1 + searchResults.length) % searchResults.length);
                }
                if (event.key === "Enter" && searchResults[highlightedIndex]) {
                  router.push(searchResults[highlightedIndex].href);
                  setSearchOpen(false);
                  setMobileSearchOpen(false);
                }
              }}
              aria-label="Search Qubira"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={searchOpen}
              aria-controls="global-search-results"
              aria-activedescendant={searchResults.length ? `global-search-result-${highlightedIndex}` : undefined}
              aria-keyshortcuts="Control+K Meta+K"
              placeholder={`Search ${pageLabel.toLowerCase()}...`}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
            <kbd className="hidden shrink-0 rounded-md border border-[var(--border-default)] bg-[var(--surface-elevated)] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--text-muted)] transition-colors duration-200 group-focus-within/search:border-[var(--accent)]/40 group-focus-within/search:text-[var(--accent-strong)] sm:inline">
              ⌘K
            </kbd>
          </div>

          <AnimatePresence>
            {searchOpen && searchQuery.trim().length >= 2 && (
              <>
                <motion.button
                  type="button"
                  aria-label="Close search results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: MOTION_DURATIONS.fast }}
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => {
                    setSearchOpen(false);
                    setMobileSearchOpen(false);
                  }}
                />
                <motion.div
                  id="global-search-results"
                  role="listbox"
                  aria-label="Search results"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.command }}
                  className="absolute left-0 top-full z-40 mt-2 max-h-96 w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] shadow-2xl shadow-black/60"
                >
                  {searching ? (
                    <div className="flex items-center gap-2.5 px-4 py-4 text-xs text-[var(--text-muted)]">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                      Searching Qubira command center…
                    </div>
                  ) : searchError ? (
                    <p className="px-4 py-3 text-xs text-rose-300">Search is temporarily unavailable.</p>
                  ) : searchResults.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[var(--text-muted)]">No matching results found.</p>
                  ) : (
                    searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.href}-${index}`}
                        id={`global-search-result-${index}`}
                        type="button"
                        role="option"
                        aria-selected={highlightedIndex === index}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => {
                          router.push(result.href);
                          setSearchOpen(false);
                          setMobileSearchOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3 text-left last:border-0 transition-colors duration-150 ${
                          highlightedIndex === index
                            ? "bg-[var(--accent)]/10 text-[var(--text-primary)]"
                            : "hover:bg-[var(--surface-subtle)]"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                            {result.title}
                          </span>
                          <span className="block truncate text-xs text-[var(--text-muted)]">
                            {result.detail}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 rounded-md bg-[var(--surface-card)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                          {result.type}
                          <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </button>
                    ))
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute left-0 top-full hidden items-center gap-1.5 pt-1 text-[10px] text-[var(--text-muted)] md:flex">
        <span className="opacity-60">Workspace</span>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-[var(--text-secondary)]">{pageLabel}</span>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-4">
        <button
          type="button"
          aria-label="Search Qubira"
          aria-expanded={mobileSearchOpen}
          onClick={() => {
            const willOpen = !mobileSearchOpen;
            setMobileSearchOpen(willOpen);
            setSearchOpen(willOpen);
            if (willOpen) window.requestAnimationFrame(() => searchInputRef.current?.focus());
          }}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)] active:scale-95 max-[359px]:h-9 max-[359px]:w-9 sm:hidden"
        >
          <Search className="h-[17px] w-[17px]" />
        </button>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <span className="hidden sm:block"><ThemeToggle /></span>
          <span className="hidden sm:block"><ActivityMenu /></span>
          <NotificationMenu />
          <ProfileMenu />
        </div>
      </div>
    </motion.header>
  );
}
