"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function ChallengeRedirectInner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/practice/tasks");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070A0F] flex items-center justify-center text-slate-400 text-sm">
      Routing to Practice Tasks & Challenges...
    </div>
  );
}

export default function ChallengeRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <ChallengeRedirectInner />
    </Suspense>
  );
}
