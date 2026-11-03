"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CompanySpeedrunPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/battle/solo");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070A0F] px-6 text-slate-100">
      <section className="max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-bold">Timed company assessments are unavailable</h1>
        <p className="text-slate-400">
          This timed mode did not save its sessions or calculate rewards on the server. Continue with
          the available server-managed coding challenges instead.
        </p>
        <Link
          href="/battle/solo"
          className="inline-flex rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950"
        >
          Go to coding challenges
        </Link>
      </section>
    </main>
  );
}
