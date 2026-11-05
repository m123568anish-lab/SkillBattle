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
        type="button"
        onClick={handleClick}
        className="min-h-10 rounded-md px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        {title}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="min-h-10 rounded-md bg-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--text-on-accent)] transition hover:brightness-95 focus-visible:outline-none"
    >
      {title}
    </button>
  );
}