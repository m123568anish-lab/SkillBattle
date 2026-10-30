"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProblemRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/practice/coding?problem=${params.id}`);
    } else {
      router.replace("/practice/coding");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#070A0F] flex items-center justify-center text-slate-400 text-sm">
      Loading challenge environment...
    </div>
  );
}
