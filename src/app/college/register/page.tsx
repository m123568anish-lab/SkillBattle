"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { collegeService } from "@/services/college.service";
import { Building2, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CollegeRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    domain: "",
    city: "",
    state: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.admin_email || !formData.admin_password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await collegeService.registerCollege(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/college/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to register college. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-xl shadow-cyan-500/20 mb-2">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            Register College / Placement Cell
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Onboard your institution onto SkillBattle AI to manage departments, batches, placement assessments, and student performance analytics.
          </p>
        </div>

        {success ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400 animate-bounce" />
            <h2 className="text-2xl font-bold text-white">College Successfully Registered!</h2>
            <p className="text-slate-300 text-sm">
              College Admin account created. Redirecting to your Placement Dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 backdrop-blur-xl space-y-6">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-cyan-400" /> Institution Details
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">College Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indian Institute of Technology Delhi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Short Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IITD"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Domain</label>
                  <input
                    type="text"
                    placeholder="e.g. iitd.ac.in"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">City</label>
                  <input
                    type="text"
                    placeholder="New Delhi"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Delhi"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-400" /> College Admin Account
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar (Head TPO)"
                  value={formData.admin_name}
                  onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Admin Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="placement@iitd.ac.in"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Admin Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> {loading ? "Registering Institution..." : "Complete College Registration"}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
