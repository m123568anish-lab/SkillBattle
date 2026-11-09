"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

interface AuthControlsProps {
  compact?: boolean;
}

export default function AuthControls({ compact = false }: AuthControlsProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const signInClassName = compact
    ? "min-h-10 rounded-lg px-2 py-2 text-center text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"
    : "min-h-10 rounded-md px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]";
  const signUpClassName = compact
    ? "min-h-10 rounded-lg bg-[var(--accent)] px-2 py-2 text-center text-xs font-bold text-[var(--text-on-accent)]"
    : "min-h-10 rounded-md bg-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--text-on-accent)] transition hover:brightness-95";

  if (isAuthenticated) {
    return (
      <div className={compact ? "grid gap-2" : "flex items-center gap-2"}>
        <Link href="/dashboard" className={signInClassName}>Dashboard</Link>
        <button
          type="button"
          className={signUpClassName}
          onClick={async () => {
            try {
              await logout();
              router.replace("/");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to sign out.");
            }
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "flex items-center gap-2"}>
      <Link href="/login" className={signInClassName}>Sign in</Link>
      <Link href="/register" className={signUpClassName}>
        {compact ? "Register" : "Create account"}
      </Link>
    </div>
  );
}
