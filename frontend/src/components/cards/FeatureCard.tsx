"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function FeatureCard({
  title,
  description,
  icon: Icon,
}: Props) {
  return (
    <motion.div
      whileHover={{
        y: -10,
        scale: 1.03,
      }}
      transition={{ duration: 0.25 }}
      className="
        group
        rounded-3xl
        border
        border-white/10
        bg-white/5
        p-8
        backdrop-blur-xl
        transition-all
        hover:border-cyan-400/40
        hover:shadow-[0_0_40px_rgba(34,211,238,.18)]
      "
    >
      <div className="mb-6 inline-flex rounded-2xl bg-violet-600/20 p-4">
        <Icon className="h-8 w-8 text-cyan-400" />
      </div>

      <h3 className="mb-3 text-2xl font-bold text-white">
        {title}
      </h3>

      <p className="leading-7 text-slate-400">
        {description}
      </p>
    </motion.div>
  );
}