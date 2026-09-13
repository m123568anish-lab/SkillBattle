"use client";

import DashboardContent from "@/components/career-dashboard/DashboardContent";
import DashboardLayout from "@/components/career-dashboard/DashboardLayout";
import Link from "next/link";

export default function DashboardPage() {
    const resumeId = "";

    if (!resumeId) {
        return (
            <DashboardLayout>
                <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white">
                    <h1 className="text-2xl font-black">Your career dashboard is ready</h1>
                    <p className="mt-3 text-slate-400">Upload a resume first to unlock your ATS score and career insights.</p>
                    <Link href="/career/resume" className="mt-6 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950">Upload a resume</Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardContent
                resumeId={resumeId}
            />
        </DashboardLayout>
    );
}