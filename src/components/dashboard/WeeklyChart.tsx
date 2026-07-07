"use client";

import { motion } from "framer-motion";

const data = [
  { day: "Mon", value: 2 },
  { day: "Tue", value: 4 },
  { day: "Wed", value: 5 },
  { day: "Thu", value: 3 },
  { day: "Fri", value: 6 },
  { day: "Sat", value: 7 },
  { day: "Sun", value: 5 },
];

export default function WeeklyChart() {
  const max = Math.max(...data.map((d) => d.value));

  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      className="
        rounded-3xl
        border
        border-white/10
        bg-white/5
        p-8
      "
    >
      <h2 className="text-2xl font-black text-white">
        Weekly Activity
      </h2>

      <p className="mt-2 text-slate-400">
        Problems solved this week
      </p>

      <div className="mt-10 flex h-64 items-end justify-between gap-4">

        {data.map((item) => (
          <div
            key={item.day}
            className="flex flex-1 flex-col items-center"
          >
            <motion.div
              initial={{
                height: 0,
              }}
              animate={{
                height: `${(item.value / max) * 180}px`,
              }}
              transition={{
                duration: 0.8,
              }}
              className="
                w-full
                rounded-t-xl
                bg-gradient-to-t
                from-cyan-500
                to-violet-500
              "
            />

            <span className="mt-3 text-sm text-slate-400">
              {item.day}
            </span>
          </div>
        ))}

      </div>

      <div className="mt-6 flex justify-between text-sm">

        <span className="text-slate-400">
          Total Problems
        </span>

        <span className="font-semibold text-cyan-400">
          32
        </span>

      </div>

    </motion.div>
  );
}