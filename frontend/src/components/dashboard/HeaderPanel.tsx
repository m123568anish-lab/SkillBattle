"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

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
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={`Close ${title}`}
        className={`fixed inset-0 z-40 cursor-default ${
          mobilePresentation === "popover"
            ? "bg-transparent md:bg-black/45 md:backdrop-blur-[2px]"
            : "bg-black/45 backdrop-blur-[2px]"
        }`}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${
          mobilePresentation === "popover"
            ? "absolute right-0 top-[calc(100%+0.5rem)] max-h-[min(32rem,calc(100dvh-5rem))] w-[min(24rem,calc(100vw-1.5rem))] rounded-xl"
            : "fixed inset-x-0 bottom-0 mx-auto max-h-[min(78dvh,42rem)] w-full max-w-xl rounded-t-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+0.5rem)] md:mx-0 md:max-h-[min(32rem,calc(100dvh-5rem))] md:w-[min(24rem,calc(100vw-1.5rem))] md:rounded-xl"
        } z-50 flex flex-col overflow-hidden border border-white/10 bg-slate-900 shadow-2xl shadow-black/50`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <h2 className="min-w-0 truncate text-sm font-bold text-white">{title}</h2>
          <div className="flex shrink-0 items-center gap-3">
            {actions}
            <button
              type="button"
              aria-label={`Close ${title}`}
              onClick={onClose}
              className="text-slate-500 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </section>
    </>
  );
}