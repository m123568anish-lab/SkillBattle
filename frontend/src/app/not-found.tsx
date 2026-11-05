"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getPostLoginPath } from "@/lib/auth-routing";

export default function NotFound() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const workspacePath = user ? getPostLoginPath(user) : "/login";

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-[var(--surface-canvas)] px-6 text-center text-[var(--text-primary)]">
      <div>
        <Compass className="mx-auto h-14 w-14 text-[var(--accent-strong)]" />
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-[var(--accent-strong)]">404</p>
        <h1 className="mt-3 text-4xl font-black">This page does not exist</h1>
        <p className="mt-3 text-[var(--text-secondary)]">The link may be outdated, or the page may have moved.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => router.back()} className="inline-flex min-h-11 items-center rounded-md border border-[var(--border-default)] px-5 font-semibold hover:border-[var(--accent-strong)]">Go back</button>
          <Link href={workspacePath} className="inline-flex min-h-11 items-center rounded-md bg-[var(--accent)] px-5 font-bold text-[var(--text-on-accent)]">{user ? "Go to your workspace" : "Log in"}</Link>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-md px-4 font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Home</Link>
        </div>
      </div>
    </main>
  );
}