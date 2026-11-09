"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageTransition — Controlled route/content reveal for Qubira Black Edition.
 * Smooth fade and slight vertical reveal without blocking navigation.
 * Full compliance with prefers-reduced-motion.
 */
export default function PageTransition({
  children,
  className = "",
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: MOTION_DURATIONS.normal, ease: MOTION_EASINGS.command }
      }
      className={`w-full min-w-0 ${className}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer — Coordinates staggered entry for dashboard cards and command blocks.
 */
export function StaggerContainer({
  children,
  className = "",
  delayChildren = 0.04,
  staggerChildren = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: shouldReduceMotion ? 0 : delayChildren,
            staggerChildren: shouldReduceMotion ? 0 : staggerChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem — Child item inside a StaggerContainer.
 */
export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: shouldReduceMotion ? 0 : MOTION_DURATIONS.normal,
            ease: MOTION_EASINGS.command,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
