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
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-10 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Award className="mx-auto h-8 w-8 text-[var(--accent-strong)]" />
        </motion.div>
        <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading your profile...</p>
      </div>
    );
  }

  const initials = (profile.full_name || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "QB";
  const fieldClassName = "min-h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30";

  return (
    <div className="space-y-6">
      <motion.section
        aria-label="Profile overview"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] sm:p-7"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] text-2xl font-black text-[var(--accent-strong)] sm:h-24 sm:w-24">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={`Profile photo for ${profile.full_name || "your account"}`}
                width={96}
                height={96}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Learning profile
            </p>
            <h2 className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl">
              {profile.full_name || authUser?.full_name || "Your profile"}
            </h2>
            <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
              {profile.username || authUser?.username
                ? `@${profile.username || authUser?.username}`
                : profile.email || authUser?.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!error && hasProfileStats && (
                <>
                  <span className="inline-flex min-h-8 items-center rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 text-xs font-semibold text-[var(--accent-strong)]">
                    Level {profile.level}
                  </span>
                  <span className="inline-flex min-h-8 items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
                    {profile.total_xp.toLocaleString()} XP
                  </span>
                </>
              )}
              {profile.college && (
                <span className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
                  <Building className="h-3.5 w-3.5 shrink-0 text-[var(--accent-strong)]" />
                  <span className="truncate">{profile.college}</span>
                </span>
              )}
              {profile.target_company && (
                <span className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
                  <Target className="h-3.5 w-3.5 shrink-0 text-[var(--accent-strong)]" />
                  <span className="truncate">Target: {profile.target_company}</span>
                </span>
              )}
              {profile.graduation_year && (
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
                  <GraduationCap className="h-3.5 w-3.5 text-[var(--accent-strong)]" />
                  Class of {profile.graduation_year}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      <section aria-label="Profile details" className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h3 className="text-base font-bold">About you</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Education, career goals, and professional links</p>
          </div>
          <button
            type="button"
            aria-expanded={editing}
            aria-controls={editing ? "profile-editor" : undefined}
            onClick={() => setEditing((current) => !current)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--accent)]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            <Pencil size={15} />
            {editing ? "Close editor" : "Edit profile"}
          </button>
        </div>
        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {profile.bio && <div className="sm:col-span-2"><dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Bio</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">{profile.bio}</dd></div>}
          {profile.college && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">College</dt><dd className="mt-1 text-sm text-[var(--text-primary)]">{profile.college}</dd></div>}
          {profile.branch && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Branch / Major</dt><dd className="mt-1 text-sm text-[var(--text-primary)]">{profile.branch}</dd></div>}
          {profile.graduation_year && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Graduation year</dt><dd className="mt-1 text-sm text-[var(--text-primary)]">{profile.graduation_year}</dd></div>}
          {profile.target_company && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Target company</dt><dd className="mt-1 text-sm text-[var(--text-primary)]">{profile.target_company}</dd></div>}
          {profile.target_package && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Target package</dt><dd className="mt-1 text-sm text-[var(--text-primary)]">{profile.target_package}</dd></div>}
          {profile.github && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">GitHub</dt><dd className="mt-1 break-all text-sm text-[var(--accent-strong)]">{profile.github}</dd></div>}
          {profile.linkedin && <div><dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">LinkedIn</dt><dd className="mt-1 break-all text-sm text-[var(--accent-strong)]">{profile.linkedin}</dd></div>}
          {!profile.bio && !profile.college && !profile.branch && !profile.graduation_year && !profile.target_company && !profile.target_package && !profile.github && !profile.linkedin && (
            <p className="text-sm text-[var(--text-secondary)] sm:col-span-2">Add your education, goals, or professional links to complete your profile.</p>
          )}
        </dl>
      </section>

      {/* Section Tabs */}
      {editing && <>
      <div id="profile-editor" className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`relative min-h-24 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] sm:p-4 ${
              activeSection === section.id
                ? "border-[var(--accent)]/45 bg-[var(--accent)]/10 text-[var(--accent-strong)]"
                : "border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-[var(--border-focus)]/50"
            }`}
          >
            <div className="flex flex-col items-center sm:items-start gap-1.5">
              <div className={activeSection === section.id ? "text-[var(--accent-strong)]" : "text-[var(--text-muted)]"}>
                {section.icon}
              </div>
              <div className="mt-1 text-xs font-bold text-[var(--text-primary)]">{section.label}</div>
              <p className="hidden text-[10px] leading-tight text-[var(--text-muted)] sm:block">{section.description}</p>
            </div>
            {activeSection === section.id && (
              <motion.div
                layoutId="active-indicator"
                className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[var(--accent)]"
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
          className="space-y-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] sm:p-7"
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
                <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <User className="h-3.5 w-3.5" /> Basic Information
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    aria-label="Full name"
                    placeholder="Full Name"
                    value={profile.full_name ?? ""}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className={fieldClassName}
                  />
                  <input
                    aria-label="Email address"
                    disabled
                    value={profile.email ?? ""}
                    className={`${fieldClassName} cursor-not-allowed opacity-70`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <FileText className="h-3.5 w-3.5" /> Bio / Headline
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about yourself and your goals..."
                  value={profile.bio ?? ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className={`${fieldClassName} resize-none`}
                />
              </div>
            </>
          )}

          {activeSection === "education" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">College / University</label>
                  <input
                    type="text"
                    aria-label="College / University"
                    placeholder="e.g., IIT Delhi, NIT Trichy"
                    value={profile.college ?? ""}
                    onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                    className={fieldClassName}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Branch / Major</label>
                  <input
                    type="text"
                    aria-label="Branch / Major"
                    placeholder="e.g., Computer Science"
                    value={profile.branch ?? ""}
                    onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Graduation Year</label>
                <input
                  type="number"
                  aria-label="Graduation Year"
                  min={2024}
                  max={2030}
                  value={profile.graduation_year ?? ""}
                  onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  className={fieldClassName}
                />
              </div>
            </>
          )}

          {activeSection === "career" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Target Company</label>
                  <input
                    type="text"
                    aria-label="Target Company"
                    placeholder="e.g., Google, Microsoft, Razorpay"
                    value={profile.target_company ?? ""}
                    onChange={(e) => setProfile({ ...profile, target_company: e.target.value })}
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Target CTC / Package</label>
                <input
                  type="text"
                  aria-label="Target CTC / Package"
                  placeholder="e.g., 18 LPA, $120k, 25 LPA"
                  value={profile.target_package ?? ""}
                  onChange={(e) => setProfile({ ...profile, target_package: e.target.value })}
                  className={fieldClassName}
                />
              </div>
            </>
          )}

          {activeSection === "social" && (
            <>
              <div>
                <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <Link2 className="h-3.5 w-3.5" /> Social & Professional Links
                </label>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">GitHub Profile URL</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-sm text-[var(--text-muted)]">github.com/</span>
                  <input
                    type="text"
                    aria-label="GitHub Profile URL"
                    placeholder="yourusername"
                    value={profile.github ?? ""}
                    onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                    className={`${fieldClassName} pl-32`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">LinkedIn Profile URL</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-sm text-[var(--text-muted)]">linkedin.com/in/</span>
                  <input
                    type="text"
                    aria-label="LinkedIn Profile URL"
                    placeholder="yourprofile"
                    value={profile.linkedin ?? ""}
                    onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                    className={`${fieldClassName} pl-40`}
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
          role="alert"
          className="rounded-xl border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 p-4 text-sm text-[var(--status-danger)]"
        >
          {error}
        </motion.div>
      )}

      {/* Save Button */}
      <motion.button
        type="button"
        onClick={handleSave}
        disabled={saving}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-bold text-[var(--text-on-accent)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        {saving ? "Saving Profile..." : "Save & Update Profile"}
      </motion.button>
      </>}
    </div>
  );
}
