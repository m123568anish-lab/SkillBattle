"use client";

import { useRouter } from "next/navigation";

interface Props {
  title: string;
  variant?: "default" | "ghost";
}

export default function NavButton({
  title,
  variant = "default",
}: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (title === "Login") {
      router.push("/login");
    } else if (title === "Start Battle") {
      router.push("/battle");
    }
  };

  if (variant === "ghost") {
    return (
      <button
        onClick={handleClick}
        className="px-4 py-2 text-sm font-semibold text-slate-300 transition-colors duration-200 hover:text-white"
      >
        {title}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="group relative px-5 py-2 text-sm font-bold text-white transition-all duration-300 hover:scale-105"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60" />
      <span className="relative z-10 block rounded-xl border border-white/10 px-4 py-2 bg-[#070B14]/20 shadow-inner group-hover:border-cyan-300/50">
        {title}
      </span>
    </button>
  );
}