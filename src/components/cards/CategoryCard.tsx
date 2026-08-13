"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bot, Brain, Code2, Coffee, Database, Target, type LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  players: string;
  difficulty: string;
  xp: string;
  icon: string;
  color: string;
}

const iconMap: Record<string, LucideIcon> = {
  Brain,
  Bot,
  Code2,
  Coffee,
  Database,
  Target,
};

export default function CategoryCard({
  title,
  description,
  players,
  difficulty,
  xp,
  icon,
  color,
}: Props) {
  const Icon = iconMap[icon] ?? Brain;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-cyan-400/30"
    >
      <Icon className={`mb-5 h-10 w-10 ${color}`} />

      <h3 className="text-2xl font-bold text-white">
        {title}
      </h3>

      <p className="mt-3 text-slate-400">
        {description}
      </p>

      <div className="mt-6 space-y-2 text-sm text-slate-300">
        <p>👥 {players}</p>
        <p>🎯 {difficulty}</p>
        <p>⭐ {xp}</p>
      </div>

      <Button className="mt-6 w-full bg-violet-600 hover:bg-violet-700">
        Play Now
      </Button>
    </motion.div>
  );
}