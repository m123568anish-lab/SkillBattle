"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BriefcaseBusiness,
  Building,
  Camera,
  Check,
  FileText,
  GraduationCap,
  Link2,
  ShieldCheck,
  Sparkles,
  Sword,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { profileService, type Profile } from "@/services/profile.service";
import { useAuthStore } from "@/store/authStore";

const defaultProfile: Profile = {
  full_name: "",
  email: "",
  avatar: "",
  bio: "",
  college: "",
  branch: "",
  graduation_year: 2027,
  target_company: "",
  target_package: "",
  github: "",
  linkedin: "",
  total_xp: 0,
  level: 1,
};

type ProfileSection = "identity" | "education" | "career" | "social";

const SECTIONS = [
  { id: "identity", label: "Identity", icon: <User className="h-4 w-4" />, description: "Name, bio, and public profile" },
  { id: "education", label: "Education", icon: <GraduationCap className="h-4 w-4" />, description: "Academic background" },
  { id: "career", label: "Career", icon: <BriefcaseBusiness className="h-4 w-4" />, description: "Target path and brand" },
  { id: "social", label: "Links", icon: <Link2 className="h-4 w-4" />, description: "GitHub and LinkedIn" },
] as const;

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ProfileSection>("identity");

  const authUser = useAuthStore((s) => s.user);
  const updateUserPartial = useAuthStore((s) => s.updateUserPartial);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await profileService.getMyProfile();
        if (!active) return;
        setProfile({
          ...defaultProfile,
          ...data,
          full_name: data.full_name || authUser?.full_name || "",
          email: data.email || authUser?.email || "",
          avatar: data.avatar || authUser?.avatar_url || "",
        });
      } catch (err: any) {
        if (active) {
          setError(err?.response?.data?.detail || "Unable to load profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [authUser]);

  const identityStats = useMemo(
    () => [
      { label: "Level", value: String(profile.level ?? 1), icon: <Award className="h-4 w-4" /> },
      { label: "XP", value: Number(profile.total_xp ?? 0).toLocaleString(), icon: <Trophy className="h-4 w-4" /> },
      { label: "Track", value: profile.target_company ? "Career" : "Exploring", icon: <Target className="h-4 w-4" /> },
      { label: "Profile", value: profile.onboarding_completed ? "Ready" : "Draft", icon: <ShieldCheck className="h-4 w-4" /> },
    ],
    [profile.level, profile.onboarding_completed, profile.target_company, profile.total_xp],
  );

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      await profileService.updateProfile({
        full_name: profile.full_name,
        avatar: profile.avatar,
        bio: profile.bio,
        college: profile.college,
        branch: profile.branch,
        graduation_year: profile.graduation_year,
        target_company: profile.target_company,
        target_package: profile.target_package,
        github: profile.github,
        linkedin: profile.linkedin,
      });

      updateUserPartial({
        full_name: profile.full_name,
        avatar: profile.avatar,
        avatar_url: profile.avatar,
      });

      toast.success("Profile updated successfully! ✨");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save profile.");
      toast.error("Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-12 text-center text-white shadow-2xl shadow-cyan-950/10">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Award className="mx-auto h-8 w-8 text-cyan-400" />
        </motion.div>
        <p className="mt-4 text-slate-400">Loading your identity profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/60 p-6 text-white shadow-2xl shadow-violet-950/20"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 blur-md opacity-80" />
              <img
                src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.full_name || "User"}&background=0f172a&color=06b6d4&size=160&bold=true`}
                alt={profile.full_name || "Profile photo"}
                className="relative h-24 w-24 rounded-full border-4 border-slate-950 object-cover shadow-xl shadow-cyan-500/20"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">Player identity</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">{profile.full_name || "SkillBattle Player"}</h1>
              <p className="mt-1 text-sm text-slate-300">{profile.email || "No email linked yet"}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                {profile.college && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5">
                    <Building className="h-3.5 w-3.5" /> {profile.college}
                  </span>
                )}
                {profile.target_company && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5">
                    <Target className="h-3.5 w-3.5" /> {profile.target_company}
                  </span>
                )}
                {profile.branch && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5">
                    <Sword className="h-3.5 w-3.5" /> {profile.branch}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[420px]">
            {identityStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 inline-flex rounded-full bg-slate-900/80 p-2 text-cyan-300">{item.icon}</div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-xl font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  activeSection === section.id
                    ? "border-cyan-400/60 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className={`mb-2 inline-flex rounded-full p-2 ${activeSection === section.id ? "bg-cyan-500/10 text-cyan-300" : "bg-slate-900 text-slate-400"}`}>
                  {section.icon}
                </div>
                <p className="text-sm font-semibold text-white">{section.label}</p>
                <p className="mt-1 text-[11px] text-slate-400">{section.description}</p>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-violet-950/10"
            >
              {activeSection === "identity" && (
                <div className="space-y-6">
                  <div>
                    <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                      <Camera className="h-3.5 w-3.5" /> Public identity
                    </label>
                    <div className="grid gap-4 sm:grid-cols-4">
                      {[
                        "https://api.dicebear.com/7.x/bottts/svg?seed=CyberCoder",
                        "https://api.dicebear.com/7.x/bottts/svg?seed=BattleKing",
                        "https://api.dicebear.com/7.x/bottts/svg?seed=AlgoMaster",
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=Profile1",
                      ].map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProfile({ ...profile, avatar: url })}
                          className={`overflow-hidden rounded-2xl border p-1 transition ${profile.avatar === url ? "border-cyan-400 ring-2 ring-cyan-400/40" : "border-white/10 hover:border-white/30"}`}
                        >
                          <img src={url} alt={`Avatar option ${idx}`} className="h-16 w-full rounded-xl object-cover" />
                          {profile.avatar === url && <div className="mt-1 flex items-center justify-center text-cyan-300"><Check className="h-4 w-4" /></div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Full name</label>
                      <input
                        type="text"
                        value={profile.full_name ?? ""}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Email</label>
                      <input
                        type="text"
                        value={profile.email ?? ""}
                        disabled
                        className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                      <FileText className="h-3.5 w-3.5" /> Bio / headline
                    </label>
                    <textarea
                      rows={4}
                      value={profile.bio ?? ""}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell recruiters and teammates who you are, what you build, and what you are chasing."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}

              {activeSection === "education" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">College</label>
                    <input
                      value={profile.college ?? ""}
                      onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                      placeholder="IIT Delhi"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Branch</label>
                    <input
                      value={profile.branch ?? ""}
                      onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                      placeholder="Computer Science"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Graduation year</label>
                    <input
                      type="number"
                      value={profile.graduation_year ?? 2027}
                      onChange={(e) => setProfile({ ...profile, graduation_year: Number(e.target.value) || 2027 })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}

              {activeSection === "career" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Target company</label>
                      <input
                        value={profile.target_company ?? ""}
                        onChange={(e) => setProfile({ ...profile, target_company: e.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                        placeholder="Google, Microsoft, Razorpay..."
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Target package</label>
                      <input
                        value={profile.target_package ?? ""}
                        onChange={(e) => setProfile({ ...profile, target_package: e.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                        placeholder="18 LPA"
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm text-slate-300">
                    Career profile should stay in sync with your resume, mentor plan, and battle performance so recruiters see a realistic path.
                  </div>
                </div>
              )}

              {activeSection === "social" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">GitHub</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-sm text-slate-500">github.com/</span>
                      <input
                        value={profile.github ?? ""}
                        onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-32 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                        placeholder="username"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">LinkedIn</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-sm text-slate-500">linkedin.com/in/</span>
                      <input
                        value={profile.linkedin ?? ""}
                        onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-40 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                        placeholder="username"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </motion.div>
          )}

          <motion.button
            type="button"
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-500/20 transition disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {saving ? "Saving profile..." : "Save profile"}
            </span>
          </motion.button>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-cyan-950/10">
            <p className="text-xs uppercase tracking-[0.28em] text-violet-300">Competitive identity</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Battle rating</p>
                <p className="mt-2 text-3xl font-black text-white">{profile.level ? profile.level * 120 : 120}</p>
              </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Career readiness</p>
                <p className="mt-2 text-3xl font-black text-white">{profile.target_company ? "Focused" : "Exploring"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-violet-950/10">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Career identity</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className="text-sm text-slate-300">Target</span>
                <span className="font-bold text-white">{profile.target_company || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className="text-sm text-slate-300">Package</span>
                <span className="font-bold text-white">{profile.target_package || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className="text-sm text-slate-300">College</span>
                <span className="font-bold text-white">{profile.college || "Not set"}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
