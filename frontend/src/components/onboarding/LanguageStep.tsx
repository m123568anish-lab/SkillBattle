"use client";

import { useMemo, useState } from "react";

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

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
        Programming Languages
      </h1>

      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Select every language you code in or are actively learning.
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search programming languages..."
        className="mt-6 h-12 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        {filtered.map((language) => (
          <LanguageCard
            key={language}
            language={language}
            selected={selected.includes(language)}
            onClick={() => toggle(language)}
          />
        ))}

      </div>

      <div className="mt-10 flex justify-end">

        <GradientButton
          onClick={onNext}
          disabled={selected.length === 0}
        >
          Continue
        </GradientButton>

      </div>

    </div>
  );
}