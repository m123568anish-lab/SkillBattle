"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
  center?: boolean;
  className?: string;
}

export default function SectionTitle({
  badge,
  title,
  highlight,
  description,
  center = true,
  className,
}: SectionTitleProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{ once: true }}
      transition={{
        duration: 0.7,
      }}
      className={cn(
        "mb-20",
        center && "mx-auto max-w-3xl text-center",
        className
      )}
    >
      {badge && (
        <span
          className="
            inline-flex
            items-center
            rounded-full
            border
            border-cyan-500/20
            bg-cyan-500/10
            px-5
            py-2
            text-sm
            font-semibold
            uppercase
            tracking-widest
            text-cyan-300
          "
        >
          {badge}
        </span>
      )}

      <h2 className="mt-8 text-5xl font-black leading-tight text-white md:text-6xl">
        {title}

        {highlight && (
          <span
            className="
              block
              bg-gradient-to-r
              from-cyan-400
              via-violet-400
              to-pink-500
              bg-clip-text
              text-transparent
            "
          >
            {highlight}
          </span>
        )}
      </h2>

      {description && (
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-400">
          {description}
        </p>
      )}
    </motion.div>
  );
}