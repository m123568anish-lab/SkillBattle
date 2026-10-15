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
    ? "rounded-xl px-2 py-2 text-center text-xs font-bold text-slate-300 hover:bg-white/10"
    : "px-4 py-2 text-sm font-semibold text-slate-300 transition-colors duration-200 hover:text-white";
  const signUpClassName = compact
    ? "rounded-xl bg-cyan-500 px-2 py-2 text-center text-xs font-bold text-slate-950"
    : "group relative px-5 py-2 text-sm font-bold text-white transition-all duration-300 hover:scale-105";

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
