"use client";

import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Calendar, Trophy, User, Sparkles } from "lucide-react";

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
            className="rounded-[24px] border border-[#252525] bg-[#101010] p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D8FF3E]/25 bg-[#D8FF3E]/10 text-[#D8FF3E]">
                <Icon className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#F5F5F5]">{action.title}</h2>
                <p className="mt-1 text-sm text-[#A1A1AA]">{action.description}</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push(action.href)}
                className="inline-flex min-h-11 w-full items-center justify-between rounded-xl bg-[#D8FF3E] px-4 py-2.5 text-sm font-bold text-[#101010] transition hover:bg-[#EAFCCB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8FF3E]"
              >
                Explore
                <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
