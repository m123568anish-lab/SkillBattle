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
    <main className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-center text-white">
      <div>
        <Compass className="mx-auto h-14 w-14 text-cyan-400" />
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">404</p>
        <h1 className="mt-3 text-4xl font-black">This page does not exist</h1>
        <p className="mt-3 text-slate-400">The link may be outdated, or the page may have moved.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => router.back()} className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-5 font-semibold text-white hover:border-cyan-300/50">Go back</button>
          <Link href={workspacePath} className="inline-flex min-h-11 items-center rounded-xl bg-cyan-500 px-5 font-bold text-slate-950">{user ? "Go to your workspace" : "Log in"}</Link>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-slate-300 hover:text-white">Home</Link>
        </div>
      </div>
    </main>
  );
}