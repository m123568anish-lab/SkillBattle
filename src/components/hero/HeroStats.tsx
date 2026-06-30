"use client";

import CountUp from "react-countup";

const stats = [
  { label: "Active players", value: 24000 },
  { label: "Daily battles", value: 1800 },
  { label: "Success rate", value: 94 },
];

export default function HeroStats() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <p className="text-2xl font-semibold text-white">
            <CountUp end={stat.value} duration={2.5} suffix={stat.label === "Success rate" ? "%" : ""} />
          </p>
          <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
