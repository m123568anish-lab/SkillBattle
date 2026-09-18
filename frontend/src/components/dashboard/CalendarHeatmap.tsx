"use client";

import { motion } from "framer-motion";

const weeks = 12;
const days = 7;

function randomLevel() {
  return Math.floor(Math.random() * 5);
}

export default function CalendarHeatmap() {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="
        rounded-3xl
        border
        border-white/10
        bg-white/5
        p-8
      "
    >
      <h2 className="mb-6 text-2xl font-black text-white">
        📅 Study Activity
      </h2>

      <p className="mb-8 text-slate-400">
        Your last 12 weeks of coding practice.
      </p>

      <div className="overflow-x-auto">

        <div className="flex gap-1 min-w-max">

          {Array.from({ length: weeks }).map((_, week) => (

            <div
              key={week}
              className="flex flex-col gap-1"
            >

              {Array.from({ length: days }).map((__, day) => {

                const level = randomLevel();

                const colors = [
                  "bg-white/10",
                  "bg-cyan-900",
                  "bg-cyan-700",
                  "bg-cyan-500",
                  "bg-cyan-300",
                ];

                return (
                  <motion.div
                    key={day}
                    whileHover={{
                      scale: 1.4,
                    }}
                    className={`
                      h-4
                      w-4
                      rounded-sm
                      ${colors[level]}
                    `}
                  />
                );

              })}

            </div>

          ))}

        </div>

      </div>

      <div className="mt-8 flex items-center gap-4 text-sm text-slate-400">

        <span>Less</span>

        <div className="flex gap-1">

          <div className="h-4 w-4 rounded bg-white/10" />
          <div className="h-4 w-4 rounded bg-cyan-900" />
          <div className="h-4 w-4 rounded bg-cyan-700" />
          <div className="h-4 w-4 rounded bg-cyan-500" />
          <div className="h-4 w-4 rounded bg-cyan-300" />

        </div>

        <span>More</span>

      </div>

    </motion.div>
  );
}