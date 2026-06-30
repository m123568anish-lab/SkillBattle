"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Users, Trophy, GraduationCap } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: 10000,
    suffix: "+",
    label: "Active Players",
    color: "text-cyan-400",
  },
  {
    icon: Trophy,
    value: 250000,
    suffix: "+",
    label: "Battles Played",
    color: "text-yellow-400",
  },
  {
    icon: GraduationCap,
    value: 120,
    suffix: "+",
    label: "Partner Colleges",
    color: "text-violet-400",
  },
];

export default function HeroStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.5,
        duration: 0.7,
      }}
      className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/5
              p-6
              backdrop-blur-xl
              transition-all
              duration-300
              hover:border-cyan-400/40
              hover:-translate-y-1
            "
          >
            <Icon className={`mb-4 h-8 w-8 ${stat.color}`} />

            <h3 className="text-3xl font-bold text-white">
              <CountUp
                end={stat.value}
                duration={2.5}
                separator=","
              />
              {stat.suffix}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {stat.label}
            </p>
          </div>
        );
      })}
    </motion.div>
  );
}