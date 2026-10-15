"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import api from "@/services/api";
import NotificationMenu from "./NotificationMenu";
import ActivityMenu from "./ActivityMenu";
import ProfileMenu from "./ProfileMenu";
import { useAuthStore } from "@/store/authStore";
import { getDashboardPath } from "@/lib/auth-routing";

type SearchResult = {
  type: string;
  title: string;
  detail: string;
  href: string;
};

export default function TopNavbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

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
          setSearchResults(response.data.results);
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

        <div className="relative hidden w-full max-w-xs lg:block">
          <div className="flex w-full flex-1 items-center gap-3 rounded-xl border border-white/10 bg-[#0F172A] px-4 py-2.5 transition focus-within:border-cyan-400">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => {
                const value = event.target.value;
                setSearchQuery(value);
                setSearchResults([]);
                setSearchError(false);
                setSearching(value.trim().length >= 2);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
                if (event.key === "Enter" && searchResults[0]) {
                  router.push(searchResults[0].href);
                  setSearchOpen(false);
                }
              }}
              aria-label="Search SkillBattle"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={searchOpen}
              aria-controls="global-search-results"
              placeholder="Search platform..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
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
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        router.push(result.href);
                        setSearchOpen(false);
                      }}
                      className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left last:border-0 hover:bg-white/5"
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
