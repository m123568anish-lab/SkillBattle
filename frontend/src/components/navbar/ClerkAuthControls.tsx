"use client";

import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";

interface ClerkAuthControlsProps {
  compact?: boolean;
}

export default function ClerkAuthControls({ compact = false }: ClerkAuthControlsProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return <UserButton />;
  }

  const signInClassName = compact
    ? "min-h-10 rounded-lg px-2 py-2 text-center text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"
    : "min-h-10 rounded-md px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]";
  const signUpClassName = compact
    ? "min-h-10 rounded-lg bg-[var(--accent)] px-2 py-2 text-center text-xs font-bold text-[var(--text-on-accent)]"
    : "min-h-10 rounded-md bg-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--text-on-accent)] transition hover:brightness-95";

  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "flex items-center gap-2"}>
      <SignInButton mode="redirect">
        <button type="button" className={signInClassName}>
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="redirect">
        <button type="button" className={signUpClassName}>
          {compact ? "Register" : "Create account"}
        </button>
      </SignUpButton>
    </div>
  );
}
