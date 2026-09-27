"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Building2, CheckCircle2, ShieldAlert } from "lucide-react";
import { companyService, type Company } from "@/services/company.service";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [existingCompany, setExistingCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    industry: "",
    website: "",
    headquarters: "",
    description: "",
  });

  useEffect(() => {
    companyService.getMyCompany()
      .then(setExistingCompany)
      .catch((loadError) => console.error("Company registration state load error:", loadError))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const created = await companyService.registerCompany({
        ...form,
        slug: form.slug || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      });
      setExistingCompany(created);
      router.push("/company/dashboard");
    } catch (submitError: any) {
      setError(submitError?.response?.data?.detail || "Unable to register this company.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl py-6">
        <header className="mb-8 border-b border-white/10 pb-6">
          <div className="mb-3 flex items-center gap-3 text-cyan-300"><Building2 size={20} /><span className="text-xs font-semibold uppercase">Company account</span></div>
          <h1 className="text-2xl font-bold text-white">Register your company</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Company accounts are reviewed before they can publish jobs or assess applicants.</p>
        </header>

        {loading ? <p className="py-6 text-sm text-slate-400">Checking company account…</p> : existingCompany ? (
          <div className="border-y border-white/10 py-7">
            <div className="flex items-start gap-3">
              {existingCompany.status === "verified" ? <CheckCircle2 className="mt-0.5 text-emerald-400" size={20} /> : <ShieldAlert className="mt-0.5 text-amber-400" size={20} />}
              <div>
                <h2 className="font-semibold text-white">{existingCompany.name}</h2>
                <p className="mt-1 text-sm text-slate-400">Verification status: <span className="font-semibold capitalize text-slate-200">{existingCompany.status}</span></p>
                <a href="/company/dashboard" className="mt-4 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200">Open company workspace</a>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            {error && <p role="alert" className="sm:col-span-2 border-l-2 border-rose-400 pl-3 text-sm text-rose-300">{error}</p>}
            <label className="space-y-1 text-xs font-semibold text-slate-400">Legal company name
              <input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-400">Company URL slug
              <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" placeholder="company-name" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-400">Industry
              <input value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-400">Website
              <input type="url" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" placeholder="https://" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-400 sm:col-span-2">Headquarters
              <input value={form.headquarters} onChange={(event) => setForm({ ...form, headquarters: event.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-400 sm:col-span-2">Company description
              <textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" />
            </label>
            <button type="submit" disabled={submitting} className="rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{submitting ? "Submitting…" : "Submit for verification"}</button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
