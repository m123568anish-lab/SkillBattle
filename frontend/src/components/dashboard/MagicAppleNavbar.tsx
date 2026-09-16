"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Compass, List, Users, MoreHorizontal } from "lucide-react";

const NAV_ITEMS = [
  { title: "Home", href: "/dashboard", icon: Home },
  { title: "Explore", href: "/battle", icon: Compass },
  { title: "My List", href: "/challenge", icon: List },
  { title: "Social", href: "/leaderboard", icon: Users },
  { title: "More", href: "/profile", icon: MoreHorizontal },
];


export default function MagicAppleNavbar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none flex justify-center md:hidden">
      <nav
        aria-label="Mobile navigation"
        className="
          pointer-events-auto
          w-full
          max-w-lg
          flex
          items-center
          justify-between
          rounded-t-2xl
          border
          border-white/20
          bg-[#070B14]/85
          px-3
          pb-[calc(0.5rem+env(safe-area-inset-bottom))]
          pt-2
          backdrop-blur-2xl
          shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(6,182,212,0.15)]
          relative
          overflow-hidden
        "
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link key={item.title} href={item.href} className="relative flex-1">
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={`
                  flex
                  flex-col
                  items-center
                  justify-center
                  py-1.5
                  px-2
                  rounded-full
                  transition-all
                  duration-300
                  relative
                  z-10
                  ${active ? "text-cyan-300" : "text-slate-400 hover:text-slate-200"}
                `}
              >
                {/* Active Apple Floating Pill Background */}
                {active && (
                  <motion.div
                    layoutId="magic-apple-active-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="
                      absolute
                      inset-0
                      rounded-full
                      bg-gradient-to-r
                      from-cyan-500/20
                      via-violet-500/20
                      to-cyan-500/20
                      border
                      border-cyan-400/30
                      shadow-[0_0_12px_rgba(34,211,238,0.25)]
                      -z-10
                    "
                  />
                )}

                <Icon size={19} className={active ? "text-cyan-400" : ""} />
                <span className="text-[9px] font-extrabold tracking-wider uppercase mt-0.5">
                  {item.title}
                </span>

                {/* Glowing Dot on active tab */}
                {active && (
                  <motion.div
                    layoutId="magic-apple-dot"
                    className="h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] mt-0.5"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
