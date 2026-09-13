"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    document.title = "Something went wrong | SkillBattle";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-center text-white">
      <div>
        <AlertTriangle className="mx-auto h-14 w-14 text-amber-400" />
        <h1 className="mt-6 text-3xl font-black">Something went wrong</h1>
        <p className="mt-3 text-slate-400">We could not load this page. Try again or return to the dashboard.</p>
        <button onClick={() => reset()} className="mt-7 rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950">Try again</button>
      </div>
    </main>
  );
}