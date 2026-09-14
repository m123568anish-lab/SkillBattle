"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Sword, Trophy, User, Zap, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { title: "Home", href: "/dashboard", icon: Home },
  { title: "Battle", href: "/battle", icon: Sword },
  { title: "Quick Match", href: "/battle/queue", icon: Zap, isSpecial: true },
  { title: "Rankings", href: "/leaderboard", icon: Trophy },
  { title: "Profile", href: "/profile", icon: User },
];

export default function MagicAppleNavbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-3 right-3 z-50 lg:hidden pointer-events-none flex justify-center">
      <nav
        className="
          pointer-events-auto
          w-full
          max-w-md
          flex
          items-center
          justify-between
          rounded-full
          border
          border-white/20
          bg-[#070B14]/85
          px-3
          py-2
          backdrop-blur-2xl
          shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(6,182,212,0.15)]
          relative
          overflow-hidden
        "
      >
        {/* Subtle Ambient Apple Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-16 w-32 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-xl pointer-events-none" />

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          if (item.isSpecial) {
            return (
              <Link key={item.title} href={item.href} className="relative group">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-full
                    bg-gradient-to-tr
                    from-cyan-500
                    via-blue-600
                    to-violet-600
                    text-white
                    shadow-lg
                    shadow-cyan-500/30
                    border
                    border-cyan-300/40
                    relative
                  "
                >
                  <Icon size={20} className="animate-pulse" />
                  <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-cyan-300 animate-spin" style={{ animationDuration: '4s' }} />
                </motion.div>
              </Link>
            );
          }

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
