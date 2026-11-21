"use client";

import { Suspense } from "react";
import SecurityTrustCenter from "@/components/admin/security/SecurityTrustCenter";

export default function AdminSecurityPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
          Security Hardening & Trust Center
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Live posture status, cryptographic verification, and continuous audit across all 20 security controls.
        </p>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 shadow-2xl shadow-black/50">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/[0.03]" />}>
          <SecurityTrustCenter />
        </Suspense>
      </div>
    </div>
  );
}
