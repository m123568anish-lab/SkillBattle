"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Award,
  Building,
  FileText,
  GraduationCap,
  Link2,
  Pencil,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { profileService, type Profile } from "@/services/profile.service";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";
import ProfilePhotoChooser from "./ProfilePhotoChooser";

const defaultProfile: Profile = {
  full_name: "",
  email: "",
  total_xp: 0,
  level: 1,
  bio: "",
  avatar: "",
  college: "",
  branch: "",
  target_company: "",
  target_package: "",
  github: "",
  linkedin: "",
};

type ProfileSection = "personal" | "education" | "career" | "social";

interface SectionConfig {
  id: ProfileSection;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  { id: "personal", label: "Personal Info", icon: <User className="h-4 w-4" />, description: "Basic profile details and avatar" },
  { id: "education", label: "Education", icon: <GraduationCap className="h-4 w-4" />, description: "College and academic background" },
  { id: "career", label: "Career Goals", icon: <Target className="h-4 w-4" />, description: "Target companies and packages" },
  { id: "social", label: "Social Links", icon: <Link2 className="h-4 w-4" />, description: "GitHub and LinkedIn profiles" },
];

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [hasProfileStats, setHasProfileStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ProfileSection>("personal");

  const updateUserPartial = useAuthStore((s) => s.updateUserPartial);
  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await profileService.getMyProfile();
        if (active) {
          setHasProfileStats(typeof data.total_xp === "number" && typeof data.level === "number");
          setProfile({
            ...defaultProfile,
            ...data,
            full_name: data.full_name || authUser?.full_name || "",
            email: data.email || authUser?.email || "",
            avatar: data.avatar || (authUser as any)?.avatar_url || "",
          });
        }
      } catch (err: any) {
        if (active) setError(err?.response?.data?.detail || "Unable to load profile.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [authUser]);

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
      setEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save profile.");
      toast.error("Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Award className="h-8 w-8 mx-auto text-cyan-400" />
        </motion.div>
        <p className="mt-4 text-slate-400">Loading your battle profile...</p>
      </div>
    );
  }

  const initials = (profile.full_name || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SB";

  return (
    <div className="space-y-6">
      <section aria-label="Your profile" className="overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#0a0d14] text-white shadow-xl shadow-black/20 lg:hidden">
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-cyan-300 via-teal-400 to-cyan-600">
          <div aria-hidden="true" className="absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/20 bg-white/10 blur-[1px]" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-10 h-44 w-72 rounded-full bg-cyan-200/20 blur-2xl" />
        </div>
        <div className="relative -mt-14 px-4 pb-5">
          <div className="mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-[#0a0d14] bg-gradient-to-br from-cyan-400 to-violet-600 text-2xl font-black text-white shadow-lg shadow-black/40">
            {profile.avatar ? (
              <Image src={profile.avatar} alt={`Profile photo for ${profile.full_name || "your account"}`} width={112} height={112} unoptimized className="h-full w-full object-cover" />
            ) : initials}
          </div>
          <div className="mt-3 text-center">
            <h2 className="text-xl font-bold tracking-tight">{profile.full_name || authUser?.full_name || "Your profile"}</h2>
            {(profile.username || authUser?.username || profile.email) && (
              <p className="mt-1 truncate text-sm text-slate-400">
                {profile.username || authUser?.username
                  ? `@${profile.username || authUser?.username}`
                  : profile.email}
              </p>
            )}
            {!error && hasProfileStats && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  Level {profile.level}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
                  {profile.total_xp.toLocaleString()} XP
                </span>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 text-white shadow-2xl shadow-black/50 relative overflow-hidden lg:block lg:p-8"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/5 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Avatar Section */}
          <div className="relative group flex-shrink-0">
            <div className="relative h-28 w-28 rounded-2xl border-2 border-white/10 bg-[#060913] overflow-hidden shadow-xl">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={`Profile photo for ${profile.full_name || "your account"}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-cyan-600 to-violet-700 text-white font-black text-3xl">
                  {initials}
                </div>
              )}
            </div>
            <span className="absolute -bottom-2 -right-2 rounded-lg bg-cyan-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-md">
              LVL {profile.level}
            </span>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white">{profile.full_name || "SkillBattle Player"}</h2>
            </div>
            <p className="text-sm font-medium text-slate-400">{profile.email}</p>

            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
              {profile.college && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 text-xs font-semibold text-slate-300">
                  <Building className="h-3.5 w-3.5 text-violet-400" /> {profile.college}
                </span>
              )}
              {profile.target_company && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 text-xs font-semibold text-slate-300">
                  <Target className="h-3.5 w-3.5 text-cyan-400" /> {profile.target_company}
                </span>
              )}
              {profile.graduation_year && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 text-xs font-semibold text-slate-300">
                  <GraduationCap className="h-3.5 w-3.5 text-amber-400" /> Class of {profile.graduation_year}
                </span>
              )}
            </div>
          </div>
        </div>

        {!error && hasProfileStats && (
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5 sm:max-w-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total XP</p>
              <p className="mt-1 text-xl font-black text-white">{profile.total_xp.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ranked Level</p>
              <p className="mt-1 text-xl font-black text-cyan-300">Level {profile.level}</p>
            </div>
          </div>
        )}
      </motion.div>

      <section aria-label="Profile details" className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-5 text-white shadow-xl shadow-black/20 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-bold">About you</h3>
            <p className="mt-1 text-xs text-slate-400">Your education, goals, and professional links</p>
          </div>
          <button
            type="button"
            aria-expanded={editing}
            onClick={() => setEditing((current) => !current)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Pencil size={15} />
            {editing ? "Close editor" : "Edit profile"}
          </button>
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {profile.bio && <div className="sm:col-span-2"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bio</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{profile.bio}</dd></div>}
          {profile.college && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">College</dt><dd className="mt-1 text-sm text-slate-200">{profile.college}</dd></div>}
          {profile.branch && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Branch / Major</dt><dd className="mt-1 text-sm text-slate-200">{profile.branch}</dd></div>}
          {profile.graduation_year && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Graduation year</dt><dd className="mt-1 text-sm text-slate-200">{profile.graduation_year}</dd></div>}
          {profile.target_company && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target company</dt><dd className="mt-1 text-sm text-slate-200">{profile.target_company}</dd></div>}
          {profile.target_package && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target package</dt><dd className="mt-1 text-sm text-slate-200">{profile.target_package}</dd></div>}
          {profile.github && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">GitHub</dt><dd className="mt-1 break-all text-sm text-cyan-200">{profile.github}</dd></div>}
          {profile.linkedin && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">LinkedIn</dt><dd className="mt-1 break-all text-sm text-cyan-200">{profile.linkedin}</dd></div>}
          {!profile.bio && !profile.college && !profile.branch && !profile.graduation_year && !profile.target_company && !profile.target_package && !profile.github && !profile.linkedin && (
            <p className="text-sm text-slate-400 sm:col-span-2">Add your education, goals, or professional links to complete your profile.</p>
          )}
        </dl>
      </section>

      {/* Section Tabs */}
      {editing && <>
      <div id="profile-editor" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`relative rounded-2xl border p-4 text-left transition-all ${
              activeSection === section.id
                ? "border-cyan-500/40 bg-cyan-500/10 shadow-lg shadow-cyan-500/5 text-cyan-300"
                : "border-white/[0.08] bg-[#0a0f1d] hover:border-white/20 text-slate-400"
            }`}
          >
            <div className="flex flex-col items-center sm:items-start gap-1.5">
              <div className={activeSection === section.id ? "text-cyan-400" : "text-slate-400"}>
                {section.icon}
              </div>
              <div className="text-xs font-bold text-white mt-1">{section.label}</div>
              <p className="text-[10px] text-slate-400 hidden sm:block leading-tight">{section.description}</p>
            </div>
            {activeSection === section.id && (
              <motion.div
                layoutId="active-indicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 rounded-b-2xl"
              />
            )}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 text-white shadow-2xl shadow-black/50 space-y-6"
        >
          {activeSection === "personal" && (
            <>
              <div>
                <ProfilePhotoChooser
                  currentAvatar={profile.avatar}
                  fullName={profile.full_name || "User"}
                  onAvatarUpdated={(newUrl) => setProfile({ ...profile, avatar: newUrl })}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <User className="h-3.5 w-3.5" /> Basic Information
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={profile.full_name ?? ""}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />
                  <input
                    disabled
                    value={profile.email ?? ""}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <FileText className="h-3.5 w-3.5" /> Bio / Headline
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about yourself and your goals..."
                  value={profile.bio ?? ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition resize-none"
                />
              </div>
            </>
          )}

          {activeSection === "education" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">College / University</label>
                  <input
                    type="text"
                    placeholder="e.g., IIT Delhi, NIT Trichy"
                    value={profile.college ?? ""}
                    onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Branch / Major</label>
                  <input
                    type="text"
                    placeholder="e.g., Computer Science"
                    value={profile.branch ?? ""}
                    onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Graduation Year</label>
                <input
                  type="number"
                  min={2024}
                  max={2030}
                  value={profile.graduation_year ?? ""}
                  onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                />
              </div>
            </>
          )}

          {activeSection === "career" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Company Tier</label>
                  <select
                    onChange={(e) => {
                      const tier = e.target.value;
                      if (tier === "tier1") setProfile({ ...profile, target_company: "Google" });
                      else if (tier === "tier2") setProfile({ ...profile, target_company: "Razorpay" });
                      else if (tier === "tier3") setProfile({ ...profile, target_company: "TCS" });
                      else setProfile({ ...profile, target_company: "" });
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  >
                    <option value="">Select Tier...</option>
                    <option value="tier1">Tier 1 - FAANG & Premium</option>
                    <option value="tier2">Tier 2 - Startups & Unicorns</option>
                    <option value="tier3">Tier 3 - Service Providers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Company</label>
                  <input
                    type="text"
                    placeholder="e.g., Google, Microsoft, Razorpay"
                    value={profile.target_company ?? ""}
                    onChange={(e) => setProfile({ ...profile, target_company: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target CTC / Package</label>
                <input
                  type="text"
                  placeholder="e.g., 18 LPA, $120k, 25 LPA"
                  value={profile.target_package ?? ""}
                  onChange={(e) => setProfile({ ...profile, target_package: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                />
              </div>
            </>
          )}

          {activeSection === "social" && (
            <>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <Link2 className="h-3.5 w-3.5" /> Social & Professional Links
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">GitHub Profile URL</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500 text-sm">github.com/</span>
                  <input
                    type="text"
                    placeholder="yourusername"
                    value={profile.github ?? ""}
                    onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 pl-32 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">LinkedIn Profile URL</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500 text-sm">linkedin.com/in/</span>
                  <input
                    type="text"
                    placeholder="yourprofile"
                    value={profile.linkedin ?? ""}
                    onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 pl-40 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                  />
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Save Button */}
      <motion.button
        onClick={handleSave}
        disabled={saving}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {saving ? "Saving Profile..." : "Save & Update Profile"}
      </motion.button>
      </>}
    </div>
  );
}
