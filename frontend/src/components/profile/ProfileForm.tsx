"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Award,
  Building,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  Flame,
  Globe,
  GraduationCap,
  Layers,
  Link2,
  Loader2,
  Pencil,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { profileService, type Profile } from "@/services/profile.service";
import { dashboardService } from "@/services/dashboard.service";
import { practiceService } from "@/services/practice.service";
import type {
  Achievement,
  DashboardStats,
  RecentActivity,
  SkillProgress,
} from "@/types/dashboard";
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

type ViewTab = "overview" | "skills" | "achievements";
type EditSection = "personal" | "education" | "career" | "social";

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [savedProfile, setSavedProfile] = useState<Profile>(defaultProfile);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [codingSummary, setCodingSummary] = useState<{
    solved: number;
    attempted: number;
    accuracy: number | null;
  } | null>(null);
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [hasProfileStats, setHasProfileStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<ViewTab>("overview");
  const [editSection, setEditSection] = useState<EditSection>("personal");

  const updateUserPartial = useAuthStore((s) => s.updateUserPartial);
  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [profileResult, dashboardResult, practiceResult] =
          await Promise.allSettled([
            profileService.getMyProfile(),
            dashboardService.getDashboard(),
            practiceService.summary(),
          ]);

        if (active) {
          if (profileResult.status === "rejected") throw profileResult.reason;
          const data = profileResult.value;
          setHasProfileStats(
            typeof data.total_xp === "number" && typeof data.level === "number"
          );
          const nextProfile = {
            ...defaultProfile,
            ...data,
            full_name: data.full_name || authUser?.full_name || "",
            email: data.email || authUser?.email || "",
            avatar: data.avatar || (authUser as any)?.avatar_url || "",
          };
          setProfile(nextProfile);
          setSavedProfile(nextProfile);

          if (dashboardResult.status === "fulfilled") {
            setDashboardStats(dashboardResult.value.stats);
            setSkillProgress(dashboardResult.value.skill_progress ?? []);
            setAchievements(dashboardResult.value.achievements ?? []);
            setRecentActivity(dashboardResult.value.recent_activity ?? []);
          }

          if (practiceResult.status === "fulfilled") {
            setCodingSummary(practiceResult.value);
          }
        }
      } catch (err: any) {
        if (active)
          setError(err?.response?.data?.detail || "Unable to load profile data.");
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
      const updatedProfile = await profileService.updateProfile({
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

      setProfile((current) => ({ ...current, ...updatedProfile }));
      setSavedProfile((current) => ({ ...current, ...updatedProfile }));

      updateUserPartial({
        full_name: profile.full_name,
        avatar: profile.avatar,
        avatar_url: profile.avatar,
      });

      toast.success("Profile updated successfully! ✨");
      setEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to save profile changes.");
      toast.error("Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  }

  const handleCopyProfileLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-12 text-center shadow-xl">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-strong)]" />
        <p className="mt-4 text-sm font-semibold text-[var(--text-secondary)]">
          Loading your verified developer profile...
        </p>
      </div>
    );
  }

  const displayName = profile.full_name || authUser?.full_name || "Engineering Candidate";
  const username = profile.username || authUser?.username ? `@${profile.username || authUser?.username}` : profile.email || authUser?.email;
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "QB";

  // Real backend metrics (differentiating 0 from unavailable)
  const totalXP = dashboardStats?.xp !== undefined ? dashboardStats.xp : (hasProfileStats ? profile.total_xp : null);
  const level = dashboardStats?.level !== undefined ? dashboardStats.level : (hasProfileStats ? profile.level : (authUser?.level ?? 1));
  const streak = dashboardStats?.streak !== undefined ? dashboardStats.streak : null;
  const battlesWon = dashboardStats?.battles_won !== undefined ? dashboardStats.battles_won : null;
  const problemsSolved = codingSummary?.solved !== undefined ? codingSummary.solved : (dashboardStats?.practice_completed !== undefined ? dashboardStats.practice_completed : null);

  const fieldClassName =
    "min-h-12 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Developer Profile Showcase Hero */}
      <section
        aria-label="Profile identity header"
        className="relative overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl transition-all"
      >
        {/* Background Geometric Cover Graphic */}
        <div className="relative h-44 w-full overflow-hidden bg-[linear-gradient(135deg,#0d1117_0%,#161b22_50%,#090d12_100%)] sm:h-52">
          {/* Subtle grid pattern & glow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(#D8FF3E_1px,transparent_1px)] [background-size:24px_24px] opacity-15"
          />
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[var(--accent)]/15 blur-[90px]"
          />
          <div
            aria-hidden="true"
            className="absolute left-1/3 -bottom-10 h-56 w-56 rounded-full bg-cyan-500/15 blur-[80px]"
          />

          {/* Action pills inside banner */}
          <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
            <button
              type="button"
              onClick={handleCopyProfileLink}
              title="Copy Profile Link"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 text-xs font-semibold text-white/80 backdrop-blur-md transition hover:bg-black/60 hover:text-white"
            >
              <Copy size={13} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (editing) setProfile(savedProfile);
                setEditing((prev) => !prev);
              }}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition shadow-md backdrop-blur-md ${
                editing
                  ? "border border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                  : "border border-[var(--accent)]/40 bg-[var(--accent)]/20 text-[var(--accent-strong)] hover:bg-[var(--accent)]/30"
              }`}
            >
              <Pencil size={13} />
              <span>{editing ? "Cancel Editing" : "Edit Profile"}</span>
            </button>
          </div>
        </div>

        {/* Profile Avatar & Details Row */}
        <div className="relative px-5 pb-6 pt-0 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
            {/* Avatar with photo update button */}
            <div className="group relative -mt-16 sm:-mt-20 shrink-0">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-[var(--surface-card)] bg-[var(--surface-elevated)] shadow-2xl sm:h-32 sm:w-32">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={`Avatar for ${displayName}`}
                    width={128}
                    height={128}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,rgba(216,255,62,0.15)_0%,rgba(16,16,16,1)_100%)] font-mono text-3xl font-black text-[var(--accent-strong)]">
                    {initials}
                  </div>
                )}
              </div>

              {/* Edit Avatar Trigger */}
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setEditSection("personal");
                }}
                title="Change Profile Photo"
                className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-canvas)] text-[var(--accent-strong)] shadow-lg transition hover:scale-110 active:scale-95"
              >
                <Pencil size={13} />
              </button>
            </div>

            {/* Profile Identity Details */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-black tracking-tight text-[var(--text-primary)] sm:text-3xl">
                  {displayName}
                </h2>
                <span
                  title="Verified Account"
                  className="inline-flex items-center text-[var(--accent)]"
                >
                  <ShieldCheck size={18} />
                </span>
                <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                  Level {level}
                </span>
              </div>

              <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                {username}
              </p>

              {/* Academic & Career Identity Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {profile.college && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                    <Building className="h-3.5 w-3.5 text-[var(--accent-strong)]" />
                    <span className="truncate">{profile.college}</span>
                  </span>
                )}
                {profile.branch && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                    <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{profile.branch}</span>
                  </span>
                )}
                {profile.graduation_year && (
                  <span className="inline-flex items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-2.5 py-1 font-mono text-xs font-semibold text-[var(--text-muted)]">
                    Class of {profile.graduation_year}
                  </span>
                )}
                {profile.target_company && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2.5 py-1 text-xs font-bold text-[var(--accent-strong)]">
                    <Target className="h-3.5 w-3.5" />
                    <span>Target: {profile.target_company}</span>
                  </span>
                )}
                {profile.target_package && (
                  <span className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-400">
                    Goal: {profile.target_package}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Verified Performance Metrics */}
      <section
        aria-label="Profile metrics overview"
        className="grid grid-cols-2 gap-3.5 sm:grid-cols-4"
      >
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-sm transition hover:border-[var(--accent)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Total XP
            </span>
            <Trophy size={15} className="text-[var(--accent-strong)]" />
          </div>
          <p className="mt-2 font-mono text-2xl font-black tabular-nums text-[var(--text-primary)]">
            {totalXP !== null ? totalXP.toLocaleString() : "—"}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {totalXP !== null ? `Level ${level} Engineer Tier` : "Telemetry unavailable"}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-sm transition hover:border-[var(--accent)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Coding Solved
            </span>
            <Code2 size={15} className="text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-black tabular-nums text-[var(--text-primary)]">
            {problemsSolved !== null ? problemsSolved.toLocaleString() : "—"}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {problemsSolved !== null
              ? (codingSummary?.accuracy != null ? `${Math.round(codingSummary.accuracy)}% accuracy` : "Problems recorded")
              : "Telemetry unavailable"}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-sm transition hover:border-[var(--accent)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Battles Won
            </span>
            <Swords size={15} className="text-cyan-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-black tabular-nums text-[var(--text-primary)]">
            {battlesWon !== null ? battlesWon.toLocaleString() : "—"}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {battlesWon !== null ? "Arena duels conquered" : "Telemetry unavailable"}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 sm:p-5 shadow-sm transition hover:border-[var(--accent)]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Daily Streak
            </span>
            <Flame size={15} className="text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-black tabular-nums text-[var(--text-primary)]">
            {streak !== null ? streak : "—"}{" "}
            {streak !== null && (
              <span className="text-sm font-semibold text-[var(--text-muted)]">
                {streak === 1 ? "day" : "days"}
              </span>
            )}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {streak !== null ? "Active learning streak" : "Telemetry unavailable"}
          </p>
        </div>
      </section>

      {/* 3. Editing Mode Interface or Tabbed Portfolio View */}
      {editing ? (
        <section
          id="profile-editor"
          aria-label="Edit Profile Details"
          className="space-y-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-2xl sm:p-8"
        >
          {/* Edit Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Edit Profile Information
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Update your education, goals, and technical links.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfile(savedProfile);
                  setEditing(false);
                }}
                className="rounded-xl border border-[var(--border-default)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-[var(--text-on-accent)] shadow-[0_0_12px_rgba(216,255,62,0.3)] transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section Picker Pills */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { id: "personal", label: "Personal Info", icon: User },
              { id: "education", label: "Education", icon: GraduationCap },
              { id: "career", label: "Career Goals", icon: Target },
              { id: "social", label: "Social Links", icon: Link2 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setEditSection(id as EditSection)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                  editSection === id
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-strong)]"
                    : "border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30"
                }`}
              >
                <Icon size={16} />
                <span className="text-xs font-bold">{label}</span>
              </button>
            ))}
          </div>

          {/* Section Form Inputs */}
          <div className="space-y-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 sm:p-6">
            {editSection === "personal" && (
              <div className="space-y-4">
                <ProfilePhotoChooser
                  currentAvatar={profile.avatar}
                  fullName={profile.full_name || "User"}
                  onAvatarUpdated={(newUrl) => {
                    setProfile((current) => ({ ...current, avatar: newUrl }));
                    setSavedProfile((current) => ({ ...current, avatar: newUrl }));
                  }}
                />

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      aria-label="Full Name"
                      placeholder="e.g., Alex Johnson"
                      value={profile.full_name ?? ""}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className={fieldClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Email Address (Read-only)
                    </label>
                    <input
                      aria-label="Email Address"
                      disabled
                      value={profile.email ?? ""}
                      className={`${fieldClassName} cursor-not-allowed opacity-60`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Bio & Professional Headline
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your technical background, coding interests, and placement aspirations..."
                    value={profile.bio ?? ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className={`${fieldClassName} resize-none`}
                  />
                </div>
              </div>
            )}

            {editSection === "education" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      College / University
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., IIT Bombay, NIT Surathkal, VIT"
                      value={profile.college ?? ""}
                      onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                      className={fieldClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Branch / Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Computer Science & Engineering"
                      value={profile.branch ?? ""}
                      onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                      className={fieldClassName}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    min={2023}
                    max={2032}
                    placeholder="e.g., 2026"
                    value={profile.graduation_year ?? ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        graduation_year: e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      })
                    }
                    className={fieldClassName}
                  />
                </div>
              </div>
            )}

            {editSection === "career" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Target Company
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Google, Microsoft, Atlassian, Razorpay"
                      value={profile.target_company ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, target_company: e.target.value })
                      }
                      className={fieldClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Target CTC / Package
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 24 LPA, $140k"
                      value={profile.target_package ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, target_package: e.target.value })
                      }
                      className={fieldClassName}
                    />
                  </div>
                </div>
              </div>
            )}

            {editSection === "social" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    GitHub Profile
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 font-mono text-sm text-[var(--text-muted)]">
                      github.com/
                    </span>
                    <input
                      type="text"
                      placeholder="username"
                      value={profile.github ?? ""}
                      onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                      className={`${fieldClassName} pl-32 font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    LinkedIn Profile
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 font-mono text-sm text-[var(--text-muted)]">
                      linkedin.com/in/
                    </span>
                    <input
                      type="text"
                      placeholder="profile-id"
                      value={profile.linkedin ?? ""}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                      className={`${fieldClassName} pl-40 font-mono`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-300"
            >
              {error}
            </div>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-bold text-[var(--text-on-accent)] shadow-[0_0_20px_rgba(216,255,62,0.3)] transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving profile changes...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Save & Publish Profile</span>
              </>
            )}
          </button>
        </section>
      ) : (
        /* Read-Only Portfolio View with Tabs */
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
            {[
              { id: "overview", label: "Overview & Experience", icon: User },
              { id: "skills", label: "Verified Skills", icon: Layers },
              { id: "achievements", label: "Honors & Activity", icon: Award },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewTab(id as ViewTab)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  viewTab === id
                    ? "border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent-strong)] shadow-sm"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: Overview & Experience */}
          {viewTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
              {/* Left Column: Bio & Academic Credentials */}
              <div className="space-y-6">
                {/* Professional Bio */}
                <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 sm:p-7 shadow-xl">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                    <FileText size={14} /> Professional Bio
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                    {profile.bio || (
                      <span className="italic text-[var(--text-muted)]">
                        No bio provided yet. Click &quot;Edit Profile&quot; to introduce yourself to campus recruiters and fellow duelists.
                      </span>
                    )}
                  </p>
                </div>

                {/* Academic Credentials */}
                <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 sm:p-7 shadow-xl">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                    <GraduationCap size={14} /> Academic Background
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Institution / University
                      </p>
                      <p className="mt-1 font-bold text-sm text-[var(--text-primary)]">
                        {profile.college || "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Major / Branch
                      </p>
                      <p className="mt-1 font-bold text-sm text-[var(--text-primary)]">
                        {profile.branch || "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Graduation Cohort
                      </p>
                      <p className="mt-1 font-mono font-bold text-sm text-[var(--text-primary)]">
                        {profile.graduation_year ? `Class of ${profile.graduation_year}` : "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Account Verification
                      </p>
                      <p className="mt-1 flex items-center gap-1 font-bold text-xs text-emerald-400">
                        <CheckCircle2 size={13} /> Active Student Account
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Career Target & Social Connections */}
              <div className="space-y-6">
                {/* Career Goals Card */}
                <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-xl">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                    <Target size={14} /> Career Ambitions
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Dream Organization
                      </p>
                      <p className="mt-1 font-bold text-base text-[var(--text-primary)]">
                        {profile.target_company || "Open to top tech companies"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Target Package
                      </p>
                      <p className="mt-1 font-mono font-bold text-base text-emerald-400">
                        {profile.target_package || "Competitive CTC"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social & Developer Handles */}
                <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-xl">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                    <Link2 size={14} /> Connected Profiles
                  </h3>

                  <div className="mt-4 space-y-2.5">
                    {profile.github ? (
                      <a
                        href={profile.github.startsWith("http") ? profile.github : `https://github.com/${profile.github}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3.5 transition hover:border-[var(--accent)]/40 hover:bg-[var(--surface-subtle)]"
                      >
                        <span className="flex items-center gap-2.5 text-xs font-mono font-bold text-[var(--text-primary)]">
                          <Code2 size={16} className="text-[var(--accent-strong)]" />
                          github.com/{profile.github.replace(/https?:\/\/github\.com\//, "")}
                        </span>
                        <ExternalLink size={13} className="text-[var(--text-muted)] group-hover:text-[var(--accent-strong)]" />
                      </a>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-3.5 text-xs text-[var(--text-muted)]">
                        No GitHub profile linked
                      </div>
                    )}

                    {profile.linkedin ? (
                      <a
                        href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3.5 transition hover:border-cyan-500/40 hover:bg-[var(--surface-subtle)]"
                      >
                        <span className="flex items-center gap-2.5 text-xs font-mono font-bold text-[var(--text-primary)]">
                          <Globe size={16} className="text-cyan-400" />
                          linkedin.com/in/{profile.linkedin.replace(/https?:\/\/.*linkedin\.com\/in\//, "")}
                        </span>
                        <ExternalLink size={13} className="text-[var(--text-muted)] group-hover:text-cyan-400" />
                      </a>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-3.5 text-xs text-[var(--text-muted)]">
                        No LinkedIn profile linked
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Verified Skills */}
          {viewTab === "skills" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 sm:p-7 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      Verified Technical Competencies
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      Calculated from your practice submissions, battle victories, and code test-runs.
                    </p>
                  </div>
                  <Link
                    href="/practice"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)]/15 px-3 py-1.5 font-mono text-xs font-bold text-[var(--accent-strong)] hover:bg-[var(--accent)]/25"
                  >
                    <span>Practice More</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>

                {skillProgress.length > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {skillProgress.map((skill) => (
                      <div
                        key={skill.subject}
                        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[var(--text-primary)]">
                            {skill.subject}
                          </span>
                          <span className="font-mono font-bold text-[var(--accent-strong)]">
                            {skill.accuracy_percent}% Mastery
                          </span>
                        </div>
                        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                          <div
                            className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(216,255,62,0.3)] transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, skill.accuracy_percent))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] p-8 text-center">
                    <Layers className="h-8 w-8 text-[var(--text-muted)]" />
                    <p className="mt-2 text-sm font-bold text-[var(--text-primary)]">
                      No verified skill assessments yet
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Solve questions in the practice catalog or compete in battles to generate verified skill progress.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Honors & Activity */}
          {viewTab === "achievements" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Unlocked Badges */}
              <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 sm:p-7 shadow-xl">
                <h3 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
                  <Award size={17} className="text-amber-400" />
                  Unlocked Achievements & Badges
                </h3>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Milestones earned through competitive coding consistency.
                </p>

                {achievements.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {achievements.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4"
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold">
                          ★
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-[var(--text-primary)]">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-[var(--border-default)] p-6 text-center text-xs text-[var(--text-muted)]">
                    No achievements unlocked yet. Win your first match to claim badges!
                  </div>
                )}
              </div>

              {/* Recent Activity Log */}
              <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 sm:p-7 shadow-xl">
                <h3 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
                  <Activity size={17} className="text-[var(--accent-strong)]" />
                  Recent Activity Stream
                </h3>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Your latest duels, problem solves, and XP gains.
                </p>

                {recentActivity.length > 0 ? (
                  <div className="mt-4 space-y-2.5">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={`${activity.activity_date}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-xs"
                      >
                        <span className="truncate font-semibold text-[var(--text-secondary)]">
                          {activity.activity_type}
                        </span>
                        <span className="font-mono font-bold text-[var(--accent-strong)]">
                          +{activity.xp_earned} XP
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-[var(--border-default)] p-6 text-center text-xs text-[var(--text-muted)]">
                    No recent activity recorded.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
