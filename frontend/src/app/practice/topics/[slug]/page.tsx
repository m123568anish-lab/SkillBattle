"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PracticeNav from "@/components/practice/PracticeNav";
import { PageHeader } from "@/components/arena";
import { ArrowRight, BookOpen } from "lucide-react";

export default function TopicDetailPage() {
  const params = useParams();
  const rawSlug = typeof params?.slug === "string" ? params.slug : "";
  const topicTitle = rawSlug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          title={topicTitle || "Practice Topic"}
          subtitle="Practice progress is recorded from evaluated submissions associated with your account."
          theme="practice"
          breadcrumbs={[
            { label: "Qubira Learn", href: "/practice" },
            { label: "Explore Topics", href: "/practice/topics" },
            { label: topicTitle || "Practice Topic", href: "#", current: true },
          ]}
        />
        <PracticeNav />

        <section className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-300">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">{topicTitle || "Practice Topic"}</h2>
              <p className="max-w-2xl text-sm text-slate-400">
                Topic-specific question lists and completion history are not configured. Browse the active coding problem catalog to work on a database-backed exercise; accepted submissions are saved to your practice history.
              </p>
              <Link
                href="/practice/coding"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Browse practice problems <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
