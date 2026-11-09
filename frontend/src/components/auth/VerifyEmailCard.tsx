"use client";

import Link from "next/link";

export default function VerifyEmailCard() {
  return (
    <section className="rounded-[30px] border border-white/10 bg-[#0b1220]/90 p-6 text-slate-300 shadow-2xl sm:p-8">
      <h1 className="text-2xl font-black text-white">Check your inbox</h1>
      <p className="mt-3">If email verification is enabled, follow the Neon Auth message to finish verifying your address.</p>
      <Link href="/login" className="mt-6 inline-block font-semibold text-cyan-300 hover:text-cyan-200">Return to sign in</Link>
    </section>
  );
}