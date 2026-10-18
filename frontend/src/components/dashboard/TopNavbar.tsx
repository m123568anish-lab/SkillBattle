"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, ArrowUpRight, Menu } from "lucide-react";
import api from "@/services/api";
import NotificationMenu from "./NotificationMenu";
import ActivityMenu from "./ActivityMenu";
import ProfileMenu from "./ProfileMenu";
import { useAuthStore } from "@/store/authStore";
import { getDashboardPath } from "@/lib/auth-routing";

import { ThemeToggle } from "@/components/common/ExperienceEnhancements";
type SearchResult = {
  type: string;
  title: string;
  detail: string;
  href: string;
};

export default function TopNavbar({ onOpenMobileNav }: { onOpenMobileNav?: () => void } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

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
        searchInputRef.current?.focus();
        setSearchOpen(true);
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
    <header
      suppressHydrationWarning
      className="
        relative z-20
        mb-5 flex min-w-0 flex-row items-center justify-between gap-2 rounded-2xl
        border
        border-white/[0.08]
        bg-[#090e19]/80
        px-3 py-2
        backdrop-blur-xl
        shadow-sm
        shadow-black/20
        sm:mb-7 sm:gap-4 sm:px-4 sm:py-3
      "
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Menu size={18} />
          </button>
        )}
        <Link
          href={logoHref}
          aria-label="Go to your SkillBattle dashboard"
          title="Dashboard"
          className="inline-flex min-w-0 shrink-0 items-center rounded-lg px-1 py-1 text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <span className="truncate text-sm font-black tracking-tight text-white sm:text-xl">
            Skill<span className="text-cyan-300">Battle</span>
          </span>
        </Link>

        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-[#0F172A]/90 px-3 py-2 transition focus-within:border-cyan-400/70 focus-within:ring-1 focus-within:ring-cyan-400/30 sm:gap-3 sm:px-4 sm:py-2.5">
            <Search size={18} className="shrink-0 text-slate-400" />
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
                if (event.key === "Escape") setSearchOpen(false);
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
                }
              }}
              aria-label="Search SkillBattle"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={searchOpen}
              aria-controls="global-search-results"
              aria-activedescendant={searchResults.length ? `global-search-result-${highlightedIndex}` : undefined}
              aria-keyshortcuts="Control+K Meta+K"
              placeholder={`Search ${pageLabel.toLowerCase()}...`}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
            <kbd className="hidden shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline">⌘K</kbd>
          </div>
          {searchOpen && searchQuery.trim().length >= 2 && (
            <>
              <button
                type="button"
                aria-label="Close search results"
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setSearchOpen(false)}
              />
              <div
                id="global-search-results"
                role="listbox"
                aria-label="Search results"
                className="absolute left-0 top-full z-40 mt-2 max-h-96 w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-white/10 bg-slate-950 shadow-2xl"
              >
                {searching ? (
                  <p className="px-4 py-3 text-sm text-slate-400">Searching…</p>
                ) : searchError ? (
                  <p className="px-4 py-3 text-sm text-rose-300">Search is temporarily unavailable.</p>
                ) : searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-400">No matching results.</p>
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
                      }}
                      className={`flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left last:border-0 hover:bg-white/5 ${highlightedIndex === index ? "bg-cyan-400/10" : ""}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{result.title}</span>
                        <span className="block truncate text-xs text-slate-400">{result.detail}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px] uppercase text-cyan-300">
                        {result.type}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="absolute left-3 top-full hidden items-center gap-1.5 pt-1 text-[10px] text-slate-500 md:flex lg:left-[calc(theme(spacing.4)+10rem)]">
        <span className="text-slate-600">Workspace</span>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-400">{pageLabel}</span>
      </div>

      <div className="flex items-center justify-end gap-3 sm:gap-4">
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ActivityMenu />
          <NotificationMenu />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
          <ThemeToggle />
