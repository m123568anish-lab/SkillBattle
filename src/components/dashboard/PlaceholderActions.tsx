"use client";

import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Calendar, Trophy, User, Sparkles } from "lucide-react";
import GradientButton from "@/components/ui/gradient-button";

const ICONS = {
  barChart3: BarChart3,
  calendar: Calendar,
  trophy: Trophy,
  user: User,
  sparkles: Sparkles,
} as const;

export interface PlaceholderAction {
  title: string;
  description: string;
  href: string;
  icon: keyof typeof ICONS;
}

interface PlaceholderActionsProps {
  actions: PlaceholderAction[];
}

export default function PlaceholderActions({ actions }: PlaceholderActionsProps) {
  const router = useRouter();

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-3">
      {actions.map((action) => {
        const Icon: LucideIcon = ICONS[action.icon];

        return (
          <div
            key={action.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-violet-950/10"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                <Icon className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">{action.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{action.description}</p>
              </div>
            </div>

            <div className="mt-6">
              <GradientButton
                onClick={() => router.push(action.href)}
                className="w-full justify-between"
              >
                Explore
                <ArrowRight size={18} className="ml-2" />
              </GradientButton>
            </div>
          </div>
        );
      })}
    </section>
  );
}
