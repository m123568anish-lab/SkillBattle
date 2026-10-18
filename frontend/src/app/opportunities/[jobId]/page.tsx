"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink, MapPin } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/lib/api";
import type { Opportunity } from "@/services/placement.service";
import { CopyButton } from "@/components/common/CopyButton";

type Details = Opportunity & { is_open: boolean };

export default function OpportunityDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Details | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void api.get<Details>(`/company/openings/${jobId}`).then((response) => setJob(response.data)).catch(() => setError("This opportunity is unavailable."));
  }, [jobId]);

  return <DashboardLayout><main className="mx-auto max-w-4xl space-y-5 pb-6">
    <Link href="/opportunities" className="text-sm text-cyan-300">← All opportunities</Link>
    {error ? <p role="alert" className="rounded-xl border border-rose-400/30 p-4 text-rose-200">{error}</p> : !job ? <p className="text-slate-400">Loading opportunity…</p> : <article className="rounded-2xl border border-white/10 bg-[#0b1020] p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase text-cyan-300">{job.source_label} · {job.verification_status}</p>
      <h1 className="mt-2 text-2xl font-bold text-white">{job.title}</h1><p className="mt-1 text-slate-300">{job.company_name} · {job.employment_type.replaceAll("_", " ")}</p>
      <p className="mt-4 flex items-center gap-2 text-sm text-slate-400"><MapPin size={16}/>{job.location || "Location not specified"} · {job.work_mode.replace("_", " ")}</p>
      <div className="mt-6 space-y-4 text-sm leading-6 text-slate-300"><p>{job.description || "No description was provided."}</p><p><strong>Required skills:</strong> {job.required_skills || "Not specified"}</p>{job.eligibility && <p><strong>Eligibility:</strong> {job.eligibility}</p>}{job.deadline_at && <p><strong>Application deadline:</strong> {new Date(job.deadline_at).toLocaleString()}</p>}</div>
      <div className="mt-6 flex flex-wrap gap-2">{job.source_url && <CopyButton value={job.source_url} label="Copy source link" />}{job.application_url && <a href={job.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-slate-950">Apply on external site <ExternalLink size={15}/></a>}</div>
    </article>}
  </main></DashboardLayout>;
}
