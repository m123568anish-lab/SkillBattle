"use client";

import { useEffect, useState } from "react";
import MentorLayout from "@/components/mentor/MentorLayout";
import Link from "next/link";
import { careerService } from "@/services/career.service";

export default function MentorPage() {
    const [resumeId, setResumeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadResume() {
            try {
                const resume = await careerService.getUserResume();
                if (isMounted) setResumeId(resume?.id ?? null);
            } catch {
                if (isMounted) setResumeId(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadResume();
        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-center text-white">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            </main>
        );
    }

    if (!resumeId) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#050816] px-6 text-center text-white">
                <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-10">
                    <h1 className="text-2xl font-black">Upload a resume to meet your mentor</h1>
                    <p className="mt-3 text-slate-400">Your AI mentor uses your resume to tailor interview guidance.</p>
                    <Link href="/career/resume" className="mt-6 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950">Upload a resume</Link>
                </div>
            </main>
        );
    }

    return <MentorLayout resumeId={resumeId} />;
}