"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, Zap, ArrowRight, Command, Bot, Flame, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sidebarItems, SidebarItem } from "@/data/dashboard";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface QuickAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAccessModal({ isOpen, onClose }: QuickAccessModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sidebarItems;
    return sidebarItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle global keyboard shortcut Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state if listener is outside
        }
      }
      if (isOpen && e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Arrow key navigation inside modal
  const handleKeyDownInModal = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        router.push(selected.href);
        onClose();
      }
    }
  };

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A] shadow-2xl shadow-cyan-500/10 z-10"
        >
          {/* Top Search Input Bar */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
            <Search className="text-cyan-400 shrink-0" size={20} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDownInModal}
              placeholder="Search features, tools, battles (or press ESC to exit)..."
              aria-label="Quick Access Search"
              className="min-w-0 flex-1 bg-transparent text-base text-white placeholder-slate-500 outline-none"
            />
            <div className="flex items-center gap-2">
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                <Command size={10} /> K
              </kbd>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Actions Shortcuts (visible when no search query) */}
          {!query && (
            <div className="border-b border-white/5 bg-white/[0.02] p-3">
              <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Quick Shortcuts
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSelect("/battle")}
                  className="flex items-center gap-2 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-2.5 text-left text-xs font-bold text-fuchsia-300 transition hover:bg-fuchsia-500/20"
                >
                  <Flame size={16} />
                  <span>Start Battle</span>
                </button>
                <button
                  onClick={() => handleSelect("/coach")}
                  className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-left text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  <Bot size={16} />
                  <span>AI Coach</span>
                </button>
                <button
                  onClick={() => handleSelect("/career/roadmap")}
                  className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 p-2.5 text-left text-xs font-bold text-violet-300 transition hover:bg-violet-500/20"
                >
                  <Map size={16} />
                  <span>Roadmap</span>
                </button>
              </div>
            </div>
          )}

          {/* Filtered Search Results */}
          <div className="max-h-[340px] overflow-y-auto p-2 scrollbar-hide">
            {filteredItems.length > 0 ? (
              <div className="space-y-1">
                {filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition duration-150 ${
                        isSelected
                          ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30"
                          : "text-slate-300 hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`rounded-lg p-2 ${
                            isSelected
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-white/5 text-slate-400"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{item.title}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        size={16}
                        className={`transition-transform duration-200 ${
                          isSelected ? "translate-x-1 text-cyan-400" : "opacity-0"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                No matching feature found for "{query}".
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5 text-[11px] text-slate-500 bg-black/30">
            <div className="flex items-center gap-3">
              <span><kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[10px]">↑↓</kbd> Navigate</span>
              <span><kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[10px]">↵</kbd> Select</span>
              <span><kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[10px]">ESC</kbd> Close</span>
            </div>
            <span className="font-bold uppercase tracking-widest text-cyan-500/80">SkillBattle AI</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
