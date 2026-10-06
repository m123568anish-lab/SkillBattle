"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Lock, Shield, Zap, Check, AlertCircle, LogOut, MonitorSmartphone, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type SettingTab = "security" | "preferences" | "privacy";

type ActiveSession = {
  id: string;
  device_name: string;
  device_os: string;
  browser: string;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
  revoked: boolean;
  revoked_at: string | null;
  active: boolean;
};

interface TabConfig {
  id: SettingTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

type SharingSettings = {
  share_contact_info: boolean;
  share_skill_profile: boolean;
  share_assessment_results: boolean;
  allow_recruiter_search: boolean;
};

const defaultSharing: SharingSettings = {
  share_contact_info: false,
  share_skill_profile: false,
  share_assessment_results: false,
  allow_recruiter_search: false,
};

const TABS: TabConfig[] = [
  { id: "security", label: "Security", icon: <Lock className="h-4 w-4" />, description: "Password and account security" },
  { id: "preferences", label: "Preferences", icon: <Zap className="h-4 w-4" />, description: "Battle and gameplay settings" },
  { id: "privacy", label: "Privacy", icon: <Shield className="h-4 w-4" />, description: "Data and visibility controls" },
];

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<SettingTab>("security");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [sharing, setSharing] = useState<SharingSettings>(defaultSharing);
  const [sharingLoading, setSharingLoading] = useState(true);
  const [sharingSaving, setSharingSaving] = useState<keyof SharingSettings | null>(null);
  const [sharingError, setSharingError] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsSaving, setSessionsSaving] = useState<string | null | "all">(null);

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      const [privacyResult, userResult] = await Promise.allSettled([
        api.get<SharingSettings>("/profile/sharing-settings"),
        api.get<{ two_factor_enabled?: boolean }>("/auth/me"),
      ]);
      if (!active) return;
      if (privacyResult.status === "fulfilled") setSharing(privacyResult.value.data);
      else setSharingError("Candidate-sharing settings could not be loaded.");
      if (userResult.status === "fulfilled") setTwoFactorEnabled(Boolean(userResult.value.data.two_factor_enabled));
      setSharingLoading(false);
    }
    void loadSettings();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSessions() {
      try {
        const response = await api.get<ActiveSession[]>("/auth/sessions");
        if (active) setSessions(response.data);
      } catch {
        if (active) setSessions([]);
      } finally {
        if (active) setSessionsLoading(false);
      }
    }

    void loadSessions();
    return () => { active = false; };
  }, []);

  async function updateSharing(key: keyof SharingSettings, value: boolean) {
    setSharingSaving(key);
    setSharingError(null);
    try {
      const response = await api.put<SharingSettings>("/profile/sharing-settings", { ...sharing, [key]: value });
      setSharing(response.data);
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSharingError(typeof message === "string" ? message : "Sharing settings could not be saved.");
    } finally {
      setSharingSaving(null);
    }
  }

  async function startTwoFactorSetup() {
    if (!user?.email || !twoFactorPassword) {
      setError("Enter your current password to configure two-factor authentication.");
      return;
    }
    setTwoFactorLoading(true);
    setError(null);
    try {
      const response = await api.post<{ secret: string; recovery_codes: string[]; otpauth_url: string }>("/auth/2fa/setup", {
        email: user.email,
        password: twoFactorPassword,
      });
      setTwoFactorSecret(response.data.secret);
      setRecoveryCodes(response.data.recovery_codes);
      toast.success("Authenticator setup created. Verify a code to enable 2FA.");
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof message === "string" ? message : "Two-factor setup could not be started.");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function verifyTwoFactorSetup() {
    if (!user?.email || !/^\d{6}$/.test(twoFactorCode)) {
      setError("Enter the current six-digit authenticator code.");
      return;
    }
    setTwoFactorLoading(true);
    setError(null);
    try {
      await api.post("/auth/2fa/verify", { email: user.email, code: twoFactorCode });
      setTwoFactorEnabled(true);
      setTwoFactorSecret(null);
      setTwoFactorPassword("");
      setTwoFactorCode("");
      setSuccess(true);
      toast.success("Two-factor authentication enabled.");
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof message === "string" ? message : "The authenticator code could not be verified.");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function revokeSession(sessionId: string) {
    setSessionsSaving(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      toast.success("Session revoked.");
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof message === "string" ? message : "The session could not be revoked.");
    } finally {
      setSessionsSaving(null);
    }
  }

  async function signOutAllDevices() {
    setSessionsSaving("all");
    try {
      await api.post("/auth/logout-all");
      setSessions([]);
      toast.success("All other devices have been signed out.");
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof message === "string" ? message : "Sessions could not be revoked.");
    } finally {
      setSessionsSaving(null);
    }
  }

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(true);
      toast.success("Password updated successfully! ✨");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to change password.");
      toast.error("Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-violet-950/10 p-8 text-white shadow-2xl backdrop-blur-xl"
      >
        <h1 className="text-4xl font-black">Account Settings</h1>
        <p className="mt-2 text-slate-400">Manage your security, preferences, and privacy controls</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-3 gap-3">
        {TABS.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative rounded-2xl border-2 p-4 transition-all ${
              activeTab === tab.id
                ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={activeTab === tab.id ? "text-cyan-400" : "text-slate-400"}>
                {tab.icon}
              </div>
              <div className="text-xs font-semibold text-white text-center">{tab.label}</div>
            </div>
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-violet-500 rounded-b-2xl"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Security Tab */}
          {activeTab === "security" && (
            <>
              {/* Password Change Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl space-y-6"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-cyan-500/20 border border-cyan-500/30 p-3">
                    <Lock className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Change Password</h2>
                    <p className="text-sm text-slate-400 mt-1">Update your account password regularly for better security</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3"
                    >
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-300">{error}</p>
                    </motion.div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3"
                    >
                      <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-300">Password updated successfully!</p>
                    </motion.div>
                  )}

                  <motion.button
                    onClick={handlePasswordChange}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-4 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </motion.button>
                </div>
              </motion.div>

              {/* Two-Factor Authentication Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-violet-500/20 border border-violet-500/30 p-3">
                      <Shield className="h-6 w-6 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
                      <p className="text-sm text-slate-400 mt-1">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-900/80 border border-white/10 px-4 py-2">
                    <span className={`text-xs font-bold ${twoFactorEnabled ? "text-emerald-300" : "text-slate-400"}`}>{twoFactorEnabled ? "Enabled" : "Not enabled"}</span>
                  </div>
                </div>
                {!twoFactorEnabled && !twoFactorSecret && <div className="mt-5 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300" htmlFor="two-factor-password">Confirm your password to begin setup</label>
                  <input id="two-factor-password" type="password" autoComplete="current-password" value={twoFactorPassword} onChange={(event) => setTwoFactorPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400" />
                  <button type="button" disabled={twoFactorLoading} onClick={() => void startTwoFactorSetup()} className="w-full rounded-xl border-2 border-violet-500/30 bg-violet-500/10 px-5 py-3 font-bold text-violet-200 hover:border-violet-500/60 disabled:opacity-50">{twoFactorLoading ? "Preparing setup…" : "Set up authenticator"}</button>
                </div>}
                {twoFactorSecret && <div className="mt-5 space-y-4 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4">
                  <p className="text-sm text-slate-200">Add this secret to an authenticator app, then enter its current six-digit code.</p>
                  <code className="block break-all rounded-lg bg-slate-950 p-3 text-sm text-violet-200">{twoFactorSecret}</code>
                  <div><p className="text-xs font-semibold text-slate-300">Recovery codes. Store them securely; they are shown only during setup.</p><ul className="mt-2 grid gap-1 sm:grid-cols-2">{recoveryCodes.map((recoveryCode) => <li key={recoveryCode} className="font-mono text-xs text-slate-200">{recoveryCode}</li>)}</ul></div>
                  <label className="block text-xs font-semibold text-slate-300" htmlFor="two-factor-code">Authenticator code</label>
                  <input id="two-factor-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-white outline-none focus:border-violet-400" />
                  <button type="button" disabled={twoFactorLoading || twoFactorCode.length !== 6} onClick={() => void verifyTwoFactorSetup()} className="w-full rounded-xl bg-violet-500 px-5 py-3 font-bold text-white disabled:opacity-50">{twoFactorLoading ? "Verifying…" : "Verify and enable 2FA"}</button>
                </div>}
              </motion.div>

              {/* Active Sessions Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-cyan-500/20 border border-cyan-500/30 p-3">
                      <MonitorSmartphone className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Active sessions</h3>
                      <p className="mt-1 text-sm text-slate-400">Review devices signed in to your account. Refresh tokens are never displayed.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void signOutAllDevices()}
                    disabled={sessionsSaving !== null || sessions.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <LogOut className="h-4 w-4" />
                    {sessionsSaving === "all" ? "Signing out…" : "Sign out all devices"}
                  </button>
                </div>

                {sessionsLoading ? (
                  <p className="mt-6 text-sm text-slate-400" role="status">Loading active sessions…</p>
                ) : sessions.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-6 text-center text-sm text-slate-400">
                    No other active sessions were found.
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-white">{session.device_name || session.browser || session.device_os}</p>
                            {session.revoked && <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">Revoked</span>}
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {session.browser} · {session.device_os} · {session.ip_address || "Unknown location"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Last active {session.last_used_at ? new Date(session.last_used_at).toLocaleString() : "never"} · Expires {new Date(session.expires_at).toLocaleString()}
                          </p>
                        </div>
                        {!session.revoked && (
                          <button
                            type="button"
                            onClick={() => void revokeSession(session.id)}
                            disabled={sessionsSaving !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                            {sessionsSaving === session.id ? "Revoking…" : "Revoke session"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-5 text-xs leading-5 text-slate-500">
                  Revoking the current session does not immediately invalidate an already-issued access token; it remains valid until it expires. Sign out through the account menu to clear the active browser session.
                </p>
              </motion.div>
            </>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
              <h2 className="text-xl font-bold">Gameplay preferences</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Battle mode and audio preferences are not currently persisted account settings. Choose a supported mode when starting a battle; this screen does not claim to save preferences it cannot apply.</p>
            </motion.section>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
              <h2 className="text-2xl font-bold">Candidate sharing controls</h2>
              <p className="mt-2 text-sm text-slate-400">These saved settings govern recruiter visibility. Application consent is also required before a company can review candidate details.</p>
              {sharingError && <p role="alert" className="mt-4 text-sm text-rose-200">{sharingError}</p>}
              {sharingLoading ? <p role="status" className="mt-6 text-sm text-slate-400">Loading saved privacy settings…</p> : <div className="mt-6 space-y-3">
                {([
                  ["share_contact_info", "Share contact information", "Let recruiters see your name and contact details when application consent is active."],
                  ["share_skill_profile", "Share skill profile", "Allow verified skill evidence to be used for recruiter matching."],
                  ["share_assessment_results", "Share assessment results", "Allow assessment results to be considered in company applications."],
                  ["allow_recruiter_search", "Allow recruiter discovery", "Allow your shared skill profile to appear in company candidate discovery."],
                ] as const).map(([key, label, description]) => (
                  <label key={key} className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <span><span className="block font-semibold">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{description}</span></span>
                    <input type="checkbox" checked={sharing[key]} disabled={sharingSaving !== null} onChange={(event) => void updateSharing(key, event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-cyan-400" />
                  </label>
                ))}
                {sharingSaving && <p role="status" className="text-xs text-cyan-200">Saving privacy setting…</p>}
              </div>}
            </motion.section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
