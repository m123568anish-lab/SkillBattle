"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import AIThinking from "./AIThinking";
import TypingText from "./TypingText";
import ProgressStage from "./ProgressStage";

interface Props {
  onComplete: () => void;
}

const messages = [
  "Analyzing your profile...",
  "Matching dream companies...",
  "Creating your AI roadmap...",
  "Finalizing your learning journey...",
];

export default function RoadmapStep({
  onComplete,
}: Props) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= messages.length) return;

    const timer = setTimeout(() => {
      if (stage === messages.length - 1) {
        setTimeout(() => {
          onComplete();
        }, 1200);
      } else {
        setStage((prev) => prev + 1);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [stage, onComplete]);

  const progress =
    ((stage + 1) / messages.length) * 100;

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="mx-auto max-w-3xl"
    >
      <AIThinking />

      <div className="mt-10">
        <TypingText
          text={messages[stage]}
        />
      </div>

      {/* Progress Bar */}

      <div className="mt-10">

        <div className="h-3 overflow-hidden rounded-full bg-white/10">

          <motion.div
            animate={{
              width: `${progress}%`,
            }}
            transition={{
              duration: 1,
            }}
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-cyan-500
              via-sky-500
              to-violet-500
            "
          />

        </div>

        <p className="mt-3 text-center text-slate-400">

          {Math.round(progress)}%

        </p>

      </div>

      <ProgressStage
        stage={stage}
      />

      <div className="mt-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6">

        <h3 className="text-lg font-bold text-cyan-300">

          AI Engine

        </h3>

        <p className="mt-3 text-slate-300 leading-7">

          We're combining your

          <strong> programming languages</strong>,

          <strong> dream companies</strong>,

          <strong> skill assessment</strong>

          and

          <strong> learning goals</strong>

          to build a personalized preparation roadmap.

        </p>

      </div>

    </motion.div>
  );
}