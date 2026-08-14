"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Building2,
  Route,
  CheckCircle2,
} from "lucide-react";

interface Props {
  stage: number;
}

const stages = [
  {
    icon: Brain,
    title: "Analyzing Profile",
  },
  {
    icon: Building2,
    title: "Matching Companies",
  },
  {
    icon: Route,
    title: "Building Roadmap",
  },
  {
    icon: CheckCircle2,
    title: "Finalizing AI Coach",
  },
];

export default function ProgressStage({
  stage,
}: Props) {
  return (
    <div className="mt-12 space-y-5">

      {stages.map((item, index) => {
        const Icon = item.icon;

        const active = index <= stage;

        return (
          <motion.div
            key={item.title}
            initial={{
              opacity: 0,
              x: -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            className={`
              flex
              items-center
              gap-4
              rounded-2xl
              border
              p-5
              transition-all

              ${
                active
                  ? "border-cyan-500 bg-cyan-500/10"
                  : "border-white/10 bg-white/5"
              }
            `}
          >
            <Icon
              className={
                active
                  ? "text-cyan-400"
                  : "text-slate-500"
              }
            />

            <span
              className={
                active
                  ? "text-white"
                  : "text-slate-500"
              }
            >
              {item.title}
            </span>
          </motion.div>
        );
      })}

    </div>
  );
}