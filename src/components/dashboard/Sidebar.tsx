"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Trophy } from "lucide-react";

import { sidebarItems } from "@/data/dashboard";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        hidden
        lg:flex
        w-72
        flex-col
        border-r
        border-white/10
        bg-[#070B14]/80
        backdrop-blur-xl
      "
    >
      <div className="flex items-center gap-3 border-b border-white/10 p-8">

        <div className="rounded-xl bg-cyan-500/20 p-3">

          <Trophy
            className="text-cyan-400"
            size={28}
          />

        </div>

        <div>

          <h2 className="text-xl font-black text-white">
            SkillBattle
          </h2>

          <p className="text-sm text-slate-400">
            AI Coding Platform
          </p>

        </div>

      </div>

      <nav className="flex-1 p-6 space-y-3">

        {sidebarItems.map((item) => {

          const Icon = item.icon;

          const active =
            pathname === item.href;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`
                flex
                items-center
                gap-4
                rounded-xl
                px-5
                py-4
                transition-all

                ${
                  active
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <Icon size={22} />

              <span>
                {item.title}
              </span>

            </Link>
          );
        })}

      </nav>

    </aside>
  );
}