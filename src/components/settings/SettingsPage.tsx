"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Lock, Bell, Eye, Volume2, Shield, Zap, Check, AlertCircle } from "lucide-react";

type SettingTab = "security" | "preferences" | "privacy";

interface TabConfig {
  id: SettingTab;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: TabConfig[] = [
  { id: "security", label: "Security", icon: <Lock className="h-4 w-4" />, description: "Password and account security" },
  { id: "preferences", label: "Preferences", icon: <Zap className="h-4 w-4" />, description: "Battle and gameplay settings" },
  { id: "privacy", label: "Privacy", icon: <Shield className="h-4 w-4" />, description: "Data and visibility controls" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>("security");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    battleMode: "squad",
    voiceChat: true,
    notifications: true,
    showAds: false,
  });

  // Privacy state
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showStats: true,
    allowFriendRequests: true,
    showActivityStatus: true,
  });

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

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Preference updated!");
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Privacy setting updated!");
  };

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
                    <span className="text-xs font-bold text-slate-400">Not Enabled</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-6 w-full rounded-2xl border-2 border-violet-500/30 bg-violet-500/10 px-6 py-3 font-bold text-violet-300 hover:border-violet-500/60 transition"
                >
                  Enable 2FA
                </motion.button>
              </motion.div>
            </>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Battle Mode Card */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-cyan-500/20 border border-cyan-500/30 p-3">
                      <Zap className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Battle Mode</h3>
                      <p className="text-sm text-slate-400 mt-1">Choose your preferred battle mode</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    { value: "solo", label: "Solo" },
                    { value: "squad", label: "Squad" },
                    { value: "tournament", label: "Tournament" },
                  ].map((mode) => (
                    <motion.button
                      key={mode.value}
                      onClick={() => setPreferences((prev) => ({ ...prev, battleMode: mode.value }))}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`rounded-2xl border-2 p-4 transition-all ${
                        preferences.battleMode === mode.value
                          ? "border-cyan-400 bg-cyan-400/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="font-semibold text-white">{mode.label}</div>
                      {preferences.battleMode === mode.value && (
                        <Check className="h-4 w-4 text-cyan-400 mt-2" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Audio Settings */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl">
                <h3 className="text-xl font-bold mb-6">Audio Settings</h3>

                <div className="space-y-4">
                  {/* Voice Chat Toggle */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="font-semibold">Voice Chat</div>
                        <div className="text-xs text-slate-400">Enable in-game voice communication</div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => togglePreference("voiceChat")}
                      whileTap={{ scale: 0.95 }}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                        preferences.voiceChat ? "bg-cyan-500" : "bg-slate-600"
                      }`}
                    >
                      <motion.div
                        layout
                        className="h-6 w-6 rounded-full bg-white shadow-lg"
                        animate={{ x: preferences.voiceChat ? 28 : 2 }}
                      />
                    </motion.button>
                  </div>

                  {/* Notifications Toggle */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-violet-400" />
                      <div>
                        <div className="font-semibold">Notifications</div>
                        <div className="text-xs text-slate-400">Receive battle and achievement alerts</div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => togglePreference("notifications")}
                      whileTap={{ scale: 0.95 }}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                        preferences.notifications ? "bg-cyan-500" : "bg-slate-600"
                      }`}
                    >
                      <motion.div
                        layout
                        className="h-6 w-6 rounded-full bg-white shadow-lg"
                        animate={{ x: preferences.notifications ? 28 : 2 }}
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl"
            >
              <h2 className="text-2xl font-bold mb-8">Privacy Controls</h2>

              <div className="space-y-4">
                {/* Profile Visibility */}
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-emerald-400" />
                    <div>
                      <div className="font-semibold">Public Profile</div>
                      <div className="text-xs text-slate-400">Let others view your profile</div>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => togglePrivacy("profilePublic")}
                    whileTap={{ scale: 0.95 }}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                      privacy.profilePublic ? "bg-cyan-500" : "bg-slate-600"
                    }`}
                  >
                    <motion.div
                      layout
                      className="h-6 w-6 rounded-full bg-white shadow-lg"
                      animate={{ x: privacy.profilePublic ? 28 : 2 }}
                    />
                  </motion.button>
                </div>

                {/* Show Statistics */}
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <div>
                      <div className="font-semibold">Show Statistics</div>
                      <div className="text-xs text-slate-400">Display your battle stats publicly</div>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => togglePrivacy("showStats")}
                    whileTap={{ scale: 0.95 }}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                      privacy.showStats ? "bg-cyan-500" : "bg-slate-600"
                    }`}
                  >
                    <motion.div
                      layout
                      className="h-6 w-6 rounded-full bg-white shadow-lg"
                      animate={{ x: privacy.showStats ? 28 : 2 }}
                    />
                  </motion.button>
                </div>

                {/* Friend Requests */}
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-pink-400" />
                    <div>
                      <div className="font-semibold">Allow Friend Requests</div>
                      <div className="text-xs text-slate-400">Let others send you friend requests</div>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => togglePrivacy("allowFriendRequests")}
                    whileTap={{ scale: 0.95 }}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                      privacy.allowFriendRequests ? "bg-cyan-500" : "bg-slate-600"
                    }`}
                  >
                    <motion.div
                      layout
                      className="h-6 w-6 rounded-full bg-white shadow-lg"
                      animate={{ x: privacy.allowFriendRequests ? 28 : 2 }}
                    />
                  </motion.button>
                </div>

                {/* Activity Status */}
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    <div>
                      <div className="font-semibold">Show Activity Status</div>
                      <div className="text-xs text-slate-400">Show when you're online or in a battle</div>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => togglePrivacy("showActivityStatus")}
                    whileTap={{ scale: 0.95 }}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                      privacy.showActivityStatus ? "bg-cyan-500" : "bg-slate-600"
                    }`}
                  >
                    <motion.div
                      layout
                      className="h-6 w-6 rounded-full bg-white shadow-lg"
                      animate={{ x: privacy.showActivityStatus ? 28 : 2 }}
                    />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
