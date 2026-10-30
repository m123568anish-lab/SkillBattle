"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function TasksRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    const destination = qs ? `/practice/coding?${qs}` : "/practice/coding";
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#070A0F] flex items-center justify-center text-slate-400 text-sm">
      Routing to Practice Hub...
    </div>
  );
}

export default function TasksRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <TasksRedirectInner />
    </Suspense>
  );
}
