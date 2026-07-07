"use client";

import { Search, Menu, Moon } from "lucide-react";

import NotificationMenu from "./NotificationMenu";
import ProfileMenu from "./ProfileMenu";

export default function TopNavbar() {
  return (
    <header
      className="
        mb-8
        flex
        items-center
        justify-between
        rounded-2xl
        border
        border-white/10
        bg-white/5
        p-5
        backdrop-blur-xl
      "
    >
      <div className="flex items-center gap-4">

        <button className="lg:hidden">

          <Menu
            className="text-white"
            size={24}
          />

        </button>

        <div
          className="
            flex
            items-center
            gap-3
            rounded-xl
            border
            border-white/10
            bg-[#0F172A]
            px-4
            py-3
            transition
            focus-within:border-cyan-400
          "
        >
          <Search
            size={18}
            className="text-slate-400"
          />

          <input
            placeholder="Search battles, users..."
            className="
              w-64
              bg-transparent
              text-white
              outline-none
              placeholder:text-slate-500
            "
          />

        </div>

      </div>

      <div className="flex items-center gap-4">

        <button
          className="
            rounded-xl
            border
            border-white/10
            bg-white/5
            p-3
            hover:border-cyan-400
          "
        >
          <Moon
            size={20}
            className="text-white"
          />
        </button>

        <NotificationMenu />

        <ProfileMenu />

      </div>

    </header>
  );
}