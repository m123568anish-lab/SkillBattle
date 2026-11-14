"use client";

import { useMemo, useState } from "react";
import { Search, Code2, ArrowRight } from "lucide-react";
import GradientButton from "@/components/ui/gradient-button";
import { languages } from "@/data/languages";
import LanguageCard from "./LanguageCard";

interface Props {
  selected: string[];
  onChange: (value: string[]) => void;
  onNext: () => void;
}

export default function LanguageStep({
  selected,
  onChange,
  onNext,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return languages.filter((language) =>
      language.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  function toggle(language: string) {
    if (selected.includes(language)) {
      onChange(selected.filter((item) => item !== language));
    } else {
      onChange([...selected, language]);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Programming Languages
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[var(--text-secondary)]">
            Select the languages you code in or are actively learning.
          </p>
        </div>
        <div className="self-start sm:self-auto rounded-full border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
          <span className="text-[var(--accent-strong)] font-bold">{selected.length}</span> selected
        </div>
      </div>

      <div className="relative mt-6">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search programming languages..."
          className="h-12 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {filtered.map((language) => (
          <LanguageCard
            key={language}
            language={language}
            selected={selected.includes(language)}
            onClick={() => toggle(language)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-8 text-center">
          <Code2 size={32} className="mx-auto text-[var(--text-muted)]" />
          <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">No languages matching &quot;{search}&quot;</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Try a different search query or clear the filter.</p>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
        <p className="text-xs text-[var(--text-muted)]">
          {selected.length === 0 ? "Select at least 1 language to continue" : "Ready to proceed"}
        </p>
        <GradientButton
          onClick={onNext}
          disabled={selected.length === 0}
          className="group"
        >
          <span className="flex items-center gap-1.5">
            Continue <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </GradientButton>
      </div>
    </div>
  );
}