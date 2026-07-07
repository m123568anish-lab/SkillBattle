"use client";

import {
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";

export default function ProfileMenu() {
  return (
    <div className="group relative">

      <button
        className="
          flex
          items-center
          gap-3
          rounded-xl
          border
          border-white/10
          bg-white/5
          px-4
          py-2
          transition
          hover:border-cyan-400
        "
      >
        <img
          src="https://ui-avatars.com/api/?name=Manish&background=06b6d4&color=fff"
          alt="Profile"
          className="h-10 w-10 rounded-full"
        />

        <div className="hidden text-left md:block">

          <p className="font-semibold text-white">
            Manish
          </p>

          <p className="text-xs text-slate-400">
            Level 12
          </p>

        </div>

        <ChevronDown
          size={18}
          className="text-slate-400"
        />
      </button>

      <div
        className="
          invisible
          absolute
          right-0
          mt-3
          w-56
          rounded-2xl
          border
          border-white/10
          bg-[#111827]
          opacity-0
          transition-all
          group-hover:visible
          group-hover:opacity-100
        "
      >
        <button className="flex w-full items-center gap-3 px-5 py-4 text-white hover:bg-white/5">
          <User size={18} />
          My Profile
        </button>

        <button className="flex w-full items-center gap-3 px-5 py-4 text-white hover:bg-white/5">
          <Settings size={18} />
          Settings
        </button>

        <button className="flex w-full items-center gap-3 px-5 py-4 text-red-400 hover:bg-red-500/10">
          <LogOut size={18} />
          Logout
        </button>
      </div>

    </div>
  );
}