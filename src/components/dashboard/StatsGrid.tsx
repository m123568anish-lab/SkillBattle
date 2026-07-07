"use client";

import { motion } from "framer-motion";

import {
  Trophy,
  Target,
  Flame,
  Gem,
} from "lucide-react";

const stats = [
  {
    title: "Problems Solved",
    value: "247",
    icon: Trophy,
    color: "text-cyan-400",
  },
  {
    title: "Accuracy",
    value: "91%",
    icon: Target,
    color: "text-green-400",
  },
  {
    title: "Current Streak",
    value: "24",
    icon: Flame,
    color: "text-orange-400",
  },
  {
    title: "XP This Week",
    value: "3,450",
    icon: Gem,
    color: "text-violet-400",
  },
];

export default function StatsGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      {stats.map((stat) => {

        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.title}
            whileHover={{
              y: -6,
              scale: 1.02,
            }}
            className="
              rounded-3xl
              border
              border-white/10
              bg-white/5
              p-6
              transition-all
            "
          >
            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  {stat.title}
                </p>

                <h2 className="mt-3 text-4xl font-black text-white">
                  {stat.value}
                </h2>

              </div>

              <div className="rounded-2xl bg-white/5 p-4">

                <Icon
                  size={30}
                  className={stat.color}
                />

              </div>

            </div>

          </motion.div>
        );
      })}

    </div>
  );
}