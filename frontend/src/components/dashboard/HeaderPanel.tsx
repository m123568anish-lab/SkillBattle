"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion";

interface HeaderPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  actions?: ReactNode;
  mobilePresentation?: "sheet" | "popover";
  children: ReactNode;
}

export default function HeaderPanel({
  open,
  title,
  onClose,
  actions,
  mobilePresentation = "sheet",
  children,
}: HeaderPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const isPopover = mobilePresentation === "popover";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label={`Close ${title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : MOTION_DURATIONS.fast }}
            className={`fixed inset-0 z-40 cursor-default ${
              isPopover
                ? "bg-transparent md:bg-black/45 md:backdrop-blur-[2px]"
                : "bg-black/55 backdrop-blur-sm"
            }`}
            onClick={onClose}
          />

          {/* Panel Container with Spring Entrance */}
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : isPopover
                  ? { opacity: 0, scale: 0.97, y: -6 }
                  : { opacity: 0, y: "100%" }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : isPopover
                  ? { opacity: 1, scale: 1, y: 0 }
                  : { opacity: 1, y: 0 }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : isPopover
                  ? { opacity: 0, scale: 0.97, y: -4 }
                  : { opacity: 0, y: "100%" }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : isPopover
                  ? { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.command }
                  : { type: "spring", damping: 28, stiffness: 280 }
            }
            className={`${
              isPopover
                ? "absolute right-0 top-[calc(100%+0.5rem)] max-h-[min(32rem,calc(100dvh-5rem))] w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl"
                : "fixed inset-x-0 bottom-0 mx-auto max-h-[min(78dvh,42rem)] w-full max-w-xl rounded-t-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+0.5rem)] md:mx-0 md:max-h-[min(32rem,calc(100dvh-5rem))] md:w-[min(24rem,calc(100vw-1.5rem))] md:rounded-2xl"
            } z-50 flex flex-col overflow-hidden border border-[var(--border-default)] bg-[var(--surface-elevated)] shadow-2xl shadow-black/60`}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 bg-[var(--surface-card)]">
              <h2 className="min-w-0 truncate text-sm font-bold text-[var(--text-primary)]">{title}</h2>
              <div className="flex shrink-0 items-center gap-3">
                {actions}
                <button
                  type="button"
                  aria-label={`Close ${title}`}
                  onClick={onClose}
                  className="rounded-lg p-1 text-[var(--text-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
