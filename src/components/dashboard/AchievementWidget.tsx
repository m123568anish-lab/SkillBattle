"use client";

import { motion } from "framer-motion";
import { achievements } from "@/data/achievements";

export default function AchievementWidget() {
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
      <h2 className="mb-8 text-2xl font-black text-white">
        🏆 Achievements
      </h2>

      <div className="space-y-5">

        {achievements.map((item) => (

          <motion.div
            key={item.id}
            whileHover={{
              scale: 1.02,
            }}
            className={`
              rounded-2xl
              border
              p-5
              transition-all

              ${
                item.unlocked
                  ? "border-yellow-500/30 bg-yellow-500/10"
                  : "border-white/10 bg-white/5 opacity-60"
              }
            `}
          >

            <div className="flex items-center gap-4">

              <span className="text-4xl">
                {item.icon}
              </span>

              <div>

                <h3 className="font-bold text-white">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-400">
                  {item.description}
                </p>

              </div>

            </div>

          </motion.div>

        ))}

      </div>

    </motion.div>
  );
}