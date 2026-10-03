"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Menu, Trophy, Shield, Zap, ArrowUpRight, History } from "lucide-react";
import api from "@/services/api";
import NotificationMenu from "./NotificationMenu";
import ProfileMenu from "./ProfileMenu";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { getPortalKind } from "@/data/dashboard";

type SearchResult = {
  type: string;
  title: string;
  detail: string;
  href: string;
};

interface TopNavbarProps {
  onMenuClick?: () => void;
}

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const portal = getPortalKind(pathname);
  const user = useAuthStore((s) => s.user);
  const dashboard = useDashboardStore((s) => s.dashboard);
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

  const level = dashboard?.stats?.level ?? 1;
  const rating = dashboard?.stats?.rating ?? 1000;
  const xp = dashboard?.stats?.xp ?? 0;

  return (
    <header
      suppressHydrationWarning
      className="
        mb-8
        flex
        flex-col
        gap-4
        rounded-2xl
        border
        border-white/10
        bg-[#070B14]/80
        p-4
        backdrop-blur-xl
        sm:flex-row
        sm:items-center
        sm:justify-between
        relative
        z-20
      "
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-xl border border-white/10 bg-white/5 p-2.5 text-white hover:bg-white/10 transition"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full max-w-xs">
          <div
            className="
            flex
            flex-1
            items-center
            gap-3
            rounded-xl
            border
            border-white/10
            bg-[#0F172A]
            px-4
            py-2.5
            transition
            focus-within:border-cyan-400
            w-full
          "
          >
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
              className="
              w-full
              bg-transparent
              text-sm
              text-white
              outline-none
              placeholder:text-slate-500
            "
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
                        {result.type}<ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile & Live Rating Ribbon */}
      <div className="flex flex-wrap items-center gap-3.5 sm:gap-5 justify-end">
        {user && portal === "student" && (
          <div className="hidden md:flex items-center gap-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-cyan-400" />
              <span>LVL {level}</span>
            </div>
            <div className="h-3 w-[1px] bg-cyan-500/20" />
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-yellow-400" />
              <span>{rating} Rating</span>
            </div>
            <div className="h-3 w-[1px] bg-cyan-500/20" />
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-violet-400" />
              <span>{xp} XP</span>
            </div>
          </div>
        )}

        {user && portal !== "student" && (
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300">
            <Shield size={14} className="text-cyan-400" />
            <span>{portal === "college" ? "College workspace" : "Company hiring"}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {portal === "student" && (
            <Link
              href="/activity"
              aria-label="View activity"
              title="Activity"
              className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:border-cyan-300 hover:text-white"
            >
              <History className="h-4 w-4" />
            </Link>
          )}
          <NotificationMenu />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}