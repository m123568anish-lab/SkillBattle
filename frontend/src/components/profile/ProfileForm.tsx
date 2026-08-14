"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { profileService, type Profile } from "@/services/profile.service";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";
import { User, Sparkles, Building, Target, GraduationCap, Check, Camera, FileText, Link2, Award } from "lucide-react";

const defaultProfile: Profile = {
  full_name: "",
  email: "",
  bio: "",
  avatar: "",
  college: "",
  branch: "",
  graduation_year: 2027,
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
      <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Award className="h-8 w-8 mx-auto text-cyan-400" />
        </motion.div>
        <p className="mt-4 text-slate-400">Loading your battle profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-violet-950/10 p-8 text-white shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Avatar Section */}
          <div className="relative group flex-shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full blur opacity-75 group-hover:opacity-100 transition" />
              <img
                src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.full_name || 'User'}&background=06b6d4&color=fff`}
                alt="Avatar Preview"
                className="relative h-32 w-32 rounded-full border-4 border-slate-950 object-cover shadow-xl"
              />
              <div className="absolute bottom-2 right-2 rounded-full bg-cyan-500 p-2 text-slate-950 font-bold">
                <Camera className="h-4 w-4" />
              </div>
            </motion.div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-3xl font-black text-white">{profile.full_name || "Battle Warrior"}</h2>
            <p className="mt-1 text-sm text-cyan-400">{profile.email}</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              {profile.college && (
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 border border-violet-500/30 px-3 py-1.5 text-xs font-semibold text-violet-300">
                  <Building className="h-3.5 w-3.5" /> {profile.college}
                </span>
              )}
              {profile.target_company && (
                <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300">
                  <Target className="h-3.5 w-3.5" /> {profile.target_company}
                </span>
              )}
              {profile.graduation_year && (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300">
                  <GraduationCap className="h-3.5 w-3.5" /> {profile.graduation_year}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SECTIONS.map((section) => (
          <motion.button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative rounded-2xl border-2 p-4 transition-all ${
              activeSection === section.id
                ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={activeSection === section.id ? "text-cyan-400" : "text-slate-400"}>
                {section.icon}
              </div>
              <div className="text-xs font-semibold text-white text-center">{section.label}</div>
            </div>
            {activeSection === section.id && (
              <motion.div
                layoutId="active-indicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-violet-500 rounded-b-2xl"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl space-y-6"
        >
          {activeSection === "personal" && (
            <>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <Camera className="h-3.5 w-3.5" /> Avatar Selection
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {[
                      "https://api.dicebear.com/7.x/bottts/svg?seed=CyberCoder",
                      "https://api.dicebear.com/7.x/bottts/svg?seed=BattleKing",
                      "https://api.dicebear.com/7.x/bottts/svg?seed=AlgoMaster",
                      "https://api.dicebear.com/7.x/bottts/svg?seed=DevNinja",
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=Profile1",
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=Profile2",
                    ].map((url, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => setProfile({ ...profile, avatar: url })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative rounded-2xl border-2 p-1 transition overflow-hidden ${
                          profile.avatar === url
                            ? "border-cyan-400 ring-2 ring-cyan-400/50"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <img src={url} alt={`Avatar ${idx}`} className="h-14 w-14 rounded-xl object-cover" />
                        {profile.avatar === url && (
                          <motion.div layoutId="avatar-check" className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center rounded-xl">
                            <Check className="h-5 w-5 text-cyan-300" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Custom Avatar URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={profile.avatar ?? ""}
                      onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                    />
                  </div>
                </div>
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
                  value={profile.graduation_year ?? 2027}
                  onChange={(e) => setProfile({ ...profile, graduation_year: parseInt(e.target.value) || 2027 })}
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
    </div>
  );
}
