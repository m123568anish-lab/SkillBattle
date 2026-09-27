"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Award, BadgeCheck, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import {
  companyService,
  type CandidatePrivacySettings,
  type SkillActivity,
  type SkillProfile,
} from "@/services/company.service";

type SharingKey = Exclude<keyof CandidatePrivacySettings, "user_id">;

const sharingControls: Array<{ key: SharingKey; label: string; detail: string }> = [
  { key: "share_contact_info", label: "Contact details", detail: "Show my name, email, and profile links to companies I apply to." },
  { key: "share_skill_profile", label: "Verified skills", detail: "Share skill scores computed from platform activity." },
  { key: "share_assessment_results", label: "Assessment results", detail: "Share completed company assessment scores." },
  { key: "allow_recruiter_search", label: "Recruiter discovery", detail: "Allow verified companies to find me for jobs matching my shared skills." },
];

function ActivityList({ title, items }: { title: string; items: SkillActivity[] }) {
  return (
    <section className="border-t border-white/10 py-6">
      <h2 className="mb-3 text-lg font-semibold text-white">{title}</h2>
      {items.length === 0 ? <p className="text-sm text-slate-500">No completed activity yet.</p> : (
        <div className="divide-y divide-white/10">
          {items.map((item, index) => (
            <div key={`${item.source}-${item.title}-${index}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">{item.title}</div>
                <div className="text-xs text-slate-500">{item.source.replaceAll("_", " ")}{item.completed_at ? ` · ${new Date(item.completed_at).toLocaleDateString()}` : ""}</div>
              </div>
              <span className="text-sm font-semibold text-cyan-300">{item.score}%</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function SkillProfilePage() {
  const [profile, setProfile] = useState<SkillProfile | null>(null);
  const [privacy, setPrivacy] = useState<CandidatePrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SharingKey | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([companyService.getSkillProfile(), companyService.getSharingSettings()])
      .then(([skillProfile, sharingSettings]) => {
        setProfile(skillProfile);
        setPrivacy(sharingSettings);
      })
      .catch((loadError) => {
        console.error("Skill profile load error:", loadError);
        setError("Unable to load your verified profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSharing = async (key: SharingKey, checked: boolean) => {
    if (!privacy) return;
    const updated = { ...privacy, [key]: checked };
    setPrivacy(updated);
    setSaving(key);
    setMessage("");
    setError("");
    try {
      setPrivacy(await companyService.updateSharingSettings({
        share_contact_info: updated.share_contact_info,
        share_skill_profile: updated.share_skill_profile,
        share_assessment_results: updated.share_assessment_results,
        allow_recruiter_search: updated.allow_recruiter_search,
      }));
      setMessage("Sharing preferences saved.");
    } catch (saveError: any) {
      setPrivacy(privacy);
      setError(saveError?.response?.data?.detail || "Unable to save sharing preferences.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <DashboardLayout><p className="py-8 text-sm text-slate-400">Loading verified activity…</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <header className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-cyan-300"><ShieldCheck size={18} /><span className="text-xs font-semibold uppercase">SkillBattle evidence</span></div>
          <h1 className="text-2xl font-bold text-white">Verified Skill Profile</h1>
          <p className="mt-2 text-sm text-slate-400">Scores are calculated from completed practice, assessments, battles, and interviews.</p>
        </div>
        <Link href="/jobs" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">View job openings</Link>
      </header>

      {message && <p role="status" className="mb-4 flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} />{message}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-rose-300">{error}</p>}

      <section className="py-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Skill evidence</h2>
        {!profile?.skills.length ? <p className="text-sm text-slate-500">Complete platform activity to build verified skill evidence.</p> : (
          <div className="divide-y divide-white/10 border-y border-white/10">
            {profile.skills.map((skill) => (
              <div key={skill.skill} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <BadgeCheck className="shrink-0 text-emerald-400" size={19} />
                  <div className="min-w-0">
                    <div className="font-semibold text-white">{skill.skill}</div>
                    <div className="text-xs text-slate-500">{skill.attempts} verified activity{skill.attempts === 1 ? "" : "ies"} · {skill.sources.map((source) => source.replaceAll("_", " ")).join(", ")}</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-cyan-300">{skill.score}%</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-white/10 py-6">
        <h2 className="mb-1 text-lg font-semibold text-white">Recruiter sharing</h2>
        <p className="mb-4 text-sm text-slate-400">Choose which verified information can be shared. You can change these settings at any time.</p>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {sharingControls.map((control) => (
            <label key={control.key} className="flex items-start justify-between gap-4 py-4">
              <span>
                <span className="block text-sm font-medium text-white">{control.label}</span>
                <span className="mt-1 block text-xs text-slate-400">{control.detail}</span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(privacy?.[control.key])}
                disabled={!privacy || saving === control.key}
                onChange={(event) => void updateSharing(control.key, event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-cyan-500"
              />
            </label>
          ))}
        </div>
      </section>

      <ActivityList title="Practice performance" items={profile?.practice_performance ?? []} />
      <ActivityList title="Battle performance" items={profile?.battle_performance ?? []} />
      <ActivityList title="Assessment performance" items={profile?.assessment_performance ?? []} />
      <ActivityList title="Interview results" items={profile?.interview_results ?? []} />

      <section className="border-t border-white/10 py-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white"><Award size={18} className="text-amber-300" />Achievements</h2>
        {!profile?.achievements.length ? <p className="text-sm text-slate-500">No achievements earned yet.</p> : (
          <div className="divide-y divide-white/10">
            {profile.achievements.map((achievement) => (
              <div key={`${achievement.title}-${achievement.earned_at}`} className="py-3">
                <div className="font-medium text-white">{achievement.title}</div>
                <p className="text-sm text-slate-400">{achievement.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
