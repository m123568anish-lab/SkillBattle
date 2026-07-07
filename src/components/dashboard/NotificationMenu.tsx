"use client";

import { Bell } from "lucide-react";

export default function NotificationMenu() {
  return (
    <button
      className="
        relative
        rounded-xl
        border
        border-white/10
        bg-white/5
        p-3
        transition
        hover:border-cyan-400
      "
    >
      <Bell
        className="text-white"
        size={22}
      />

      <span
        className="
          absolute
          right-2
          top-2
          h-2
          w-2
          rounded-full
          bg-red-500
        "
      />
    </button>
  );
}