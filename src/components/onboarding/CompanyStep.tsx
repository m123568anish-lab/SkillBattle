"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import GradientButton from "@/components/ui/gradient-button";
import CompanyCard from "./CompanyCard";

import { companies } from "@/data/companies";

interface Props {
  selected: string[];
  onChange: (companies: string[]) => void;
  onNext: () => void;
}

type Filter = "All" | "Product" | "Service";

export default function CompanyStep({
  selected,
  onChange,
  onNext,
}: Props) {
  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<Filter>("All");

  function toggleCompany(name: string) {
    if (selected.includes(name)) {
      onChange(
        selected.filter(
          (company) => company !== name
        )
      );
    } else {
      onChange([...selected, name]);
    }
  }

  const featuredCompanies = useMemo(() => {
    return companies.filter(
      (company) =>
        company.featured &&
        company.name
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "All" ||
          company.type === filter)
    );
  }, [search, filter]);

  const otherCompanies = useMemo(() => {
    return companies.filter(
      (company) =>
        !company.featured &&
        company.name
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "All" ||
          company.type === filter)
    );
  }, [search, filter]);

  return (
    <div>

      <motion.h1
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="text-4xl font-black text-white"
      >
        Dream Companies
      </motion.h1>

      <p className="mt-3 text-slate-400">
        Select the companies you want
        to prepare for.
      </p>

      {/* Search */}

      <input
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder="Search company..."
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
          transition
          focus:border-cyan-400
        "
      />

      {/* Filter */}

      <div className="mt-6 flex flex-wrap gap-3">

        {["All", "Product", "Service"].map(
          (item) => (
            <button
              key={item}
              onClick={() =>
                setFilter(
                  item as Filter
                )
              }
              className={`
                rounded-full
                px-5
                py-2
                transition

                ${
                  filter === item
                    ? "bg-cyan-500 text-white"
                    : "bg-white/5 text-slate-300"
                }
              `}
            >
              {item}
            </button>
          )
        )}

      </div>

      {/* Featured */}

      <h2 className="mt-10 mb-5 text-xl font-bold text-white">
        ⭐ Featured Companies
      </h2>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        {featuredCompanies.map(
          (company) => (
            <CompanyCard
              key={company.id}
              company={company.name}
              type={company.type}
              selected={selected.includes(
                company.name
              )}
              onClick={() =>
                toggleCompany(
                  company.name
                )
              }
            />
          )
        )}

      </div>

      {/* Others */}

      <h2 className="mt-10 mb-5 text-xl font-bold text-white">
        All Companies
      </h2>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        {otherCompanies.map(
          (company) => (
            <CompanyCard
              key={company.id}
              company={company.name}
              type={company.type}
              selected={selected.includes(
                company.name
              )}
              onClick={() =>
                toggleCompany(
                  company.name
                )
              }
            />
          )
        )}

      </div>

      {/* Bottom */}

      <div className="mt-12 flex items-center justify-between">

        <p className="text-slate-400">

          Selected:

          <span className="ml-2 font-bold text-cyan-400">

            {selected.length}

          </span>

        </p>

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