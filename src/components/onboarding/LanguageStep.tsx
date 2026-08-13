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

      <h1 className="text-4xl font-black text-white">
        Programming Languages
      </h1>

      <p className="mt-3 text-slate-400">
        Choose every programming language you know.
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search language..."
        className="
          mt-8
          h-14
          w-full
          rounded-xl
          border
          border-white/10
          bg-white/5
          px-5
          text-white
          outline-none
          focus:border-cyan-400
        "
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