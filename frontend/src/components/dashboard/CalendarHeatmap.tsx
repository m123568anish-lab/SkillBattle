"use client";

import { motion } from "framer-motion";

const weeks = 12;
const days = 7;

function getDays(activity: Array<{ day: string; xp: number }>) {
  const values = new Map(activity.map((item) => [item.day, item.xp]));
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * days - 1));
  return Array.from({ length: weeks * days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { key, xp: values.get(key) ?? 0 };
  });
}

export default function CalendarHeatmap({ activity = [] }: { activity?: Array<{ day: string; xp: number }> }) {
  const calendarDays = getDays(activity);
  const hasActivity = activity.some((item) => item.xp > 0);
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
                const activityDay = calendarDays[week * days + day];
                const level = activityDay.xp <= 0 ? 0 : activityDay.xp < 25 ? 1 : activityDay.xp < 75 ? 2 : activityDay.xp < 150 ? 3 : 4;

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
                    title={`${activityDay.key}: ${activityDay.xp} XP`}
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

      {!hasActivity && <p className="mt-5 text-sm text-slate-400">No verified XP activity recorded yet.</p>}

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
