"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Trash2,
  Upload,
  Sparkles,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  User,
  Globe,
  RefreshCw,
} from "lucide-react";
import { profileService } from "@/services/profile.service";
import { useAuthStore } from "@/store/authStore";
import { authClient } from "@/lib/auth/client";
import { AI_AVATARS, type AIAvatar } from "@/lib/avatars";
import { toast } from "react-hot-toast";

interface ProfilePhotoChooserProps {
  currentAvatar?: string;
  fullName?: string;
  onAvatarUpdated?: (newAvatarUrl: string) => void;
}

export default function ProfilePhotoChooser({
  currentAvatar,
  fullName = "User",
  onAvatarUpdated,
}: ProfilePhotoChooserProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showCuratedGrid, setShowCuratedGrid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateUserPartial = useAuthStore((s) => s.updateUserPartial);
  const { data: session } = authClient.useSession();
  const oauthImage = (session?.user as any)?.image as string | undefined;

  useEffect(() => {
    setAvatarError(false);
  }, [currentAvatar, previewUrl]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "QB";
  };

  const activeAvatar = previewUrl || (avatarError ? null : currentAvatar);

  const isOAuthMatch = Boolean(
    oauthImage && currentAvatar && currentAvatar === oauthImage
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPEG, PNG, WebP, GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be under 5 MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const updatedProfile = await profileService.uploadAvatar(selectedFile);
      const newAvatar = updatedProfile.avatar || "";

      updateUserPartial({
        avatar: newAvatar,
        avatar_url: newAvatar,
      });

      if (onAvatarUpdated) onAvatarUpdated(newAvatar);

      toast.success("Profile photo updated successfully! ✨");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to upload profile photo.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleApplyOAuthAvatar = async () => {
    if (!oauthImage) return;

    setUploading(true);
    try {
      const updatedProfile = await profileService.updateProfile({ avatar: oauthImage });
      const newAvatar = updatedProfile.avatar || oauthImage;

      updateUserPartial({
        avatar: newAvatar,
        avatar_url: newAvatar,
      });

      if (onAvatarUpdated) onAvatarUpdated(newAvatar);

      toast.success("Connected provider photo applied! 🌐");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      toast.error("Failed to apply provider profile photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSelectCuratedAvatar = async (avatar: AIAvatar) => {
    setUploading(true);
    try {
      const updatedProfile = await profileService.updateProfile({ avatar: avatar.url });
      const newAvatar = updatedProfile.avatar || avatar.url;

      updateUserPartial({
        avatar: newAvatar,
        avatar_url: newAvatar,
      });

      if (onAvatarUpdated) onAvatarUpdated(newAvatar);

      toast.success(`Applied ${avatar.name} avatar!`);
      setShowCuratedGrid(false);
    } catch (err: any) {
      toast.error("Failed to set avatar.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const updatedProfile = await profileService.deleteAvatar();
      const newAvatar = updatedProfile.avatar || "";

      updateUserPartial({
        avatar: newAvatar,
        avatar_url: newAvatar,
      });

      if (onAvatarUpdated) onAvatarUpdated(newAvatar);

      toast.success("Profile photo removed. Initial avatar restored.");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      toast.error("Failed to remove profile photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPreview = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full rounded-3xl border border-[var(--border-default,#202022)] bg-[var(--surface-elevated,#0D0D0D)] p-6 text-[var(--text-primary,#F5F5F5)] shadow-xl transition-all sm:p-7">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Main Avatar Ring */}
        <div className="relative group shrink-0">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-[var(--border-focus,#444444)] bg-[var(--surface-input,#141414)] shadow-2xl transition-all duration-200 group-hover:border-[var(--accent,#D8FF3E)]/70 group-hover:shadow-[0_0_24px_rgba(216,255,62,0.25)]">
            {activeAvatar ? (
              <img
                src={activeAvatar}
                alt={fullName}
                onError={() => setAvatarError(true)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--accent,#D8FF3E)]/10 text-2xl font-black text-[var(--accent-strong,#D8FF3E)]">
                {getInitials(fullName)}
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--accent,#D8FF3E)]" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-default,#292929)] bg-[var(--surface-canvas,#050505)] text-[var(--accent-strong,#D8FF3E)] shadow-lg transition-transform duration-150 hover:scale-110 active:scale-95 disabled:opacity-50"
            title="Upload photo from device"
            aria-label="Upload photo from device"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* Info & Primary Action Triggers */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h4 className="text-base font-bold text-[var(--text-primary,#F5F5F5)]">
              Profile Picture
            </h4>
            {isOAuthMatch && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--accent,#D8FF3E)]/30 bg-[var(--accent,#D8FF3E)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-strong,#D8FF3E)]">
                <Globe className="h-3 w-3" /> OAuth Synced
              </span>
            )}
          </div>

          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary,#999999)]">
            Set a photo or technical avatar for match lobbies, duels, rankings, and campus recruiter discovery.
          </p>

          {/* Staged File Preview Action Banner */}
          {selectedFile ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--accent,#D8FF3E)] px-4 text-xs font-bold text-black transition hover:brightness-105 active:scale-95 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelPreview}
                disabled={uploading}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] px-3 text-xs font-medium text-[var(--text-secondary,#999999)] transition hover:text-[var(--text-primary,#F5F5F5)]"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--surface-input,#141414)] border border-[var(--border-default,#292929)] px-3.5 text-xs font-semibold text-[var(--text-primary,#F5F5F5)] transition hover:border-[var(--accent,#D8FF3E)]/40 hover:bg-[var(--surface-card,#18181a)]"
              >
                <Upload className="h-3.5 w-3.5 text-[var(--accent,#D8FF3E)]" />
                <span>Upload Photo</span>
              </button>

              {/* OAuth Avatar Button (If Available from Google/GitHub) */}
              {oauthImage && oauthImage !== currentAvatar && (
                <button
                  type="button"
                  onClick={handleApplyOAuthAvatar}
                  disabled={uploading}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--accent,#D8FF3E)]/30 bg-[var(--accent,#D8FF3E)]/10 px-3.5 text-xs font-bold text-[var(--accent-strong,#D8FF3E)] transition hover:bg-[var(--accent,#D8FF3E)]/20 active:scale-95 disabled:opacity-50"
                  title="Use avatar from your Google or GitHub account"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Use Provider Photo</span>
                </button>
              )}

              {/* Curated Tech Avatars Toggle */}
              <button
                type="button"
                onClick={() => setShowCuratedGrid((prev) => !prev)}
                disabled={uploading}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] px-3.5 text-xs font-semibold text-[var(--text-secondary,#999999)] transition hover:border-[var(--border-focus,#444444)] hover:text-[var(--text-primary,#F5F5F5)]"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{showCuratedGrid ? "Hide Avatars" : "Choose Avatar"}</span>
              </button>

              {/* Remove Photo (Restore Initials) */}
              {currentAvatar && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 text-xs font-medium text-rose-400 transition hover:bg-rose-500/15 hover:border-rose-500/40 disabled:opacity-50"
                  title="Remove custom photo and reset to initials"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Curated Developer / Cyberpunk Avatars Grid */}
      <AnimatePresence>
        {showCuratedGrid && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border-default,#202022)] mt-5 pt-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary,#999999)]">
                Curated Developer Avatars
              </span>
              <span className="text-[11px] text-[var(--text-muted,#777777)]">
                Click to apply instantly
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {AI_AVATARS.map((avatar) => {
                const isSelected = currentAvatar === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleSelectCuratedAvatar(avatar)}
                    disabled={uploading}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition-all ${
                      isSelected
                        ? "border-[var(--accent,#D8FF3E)] bg-[var(--accent,#D8FF3E)]/10 ring-2 ring-[var(--accent,#D8FF3E)]/25"
                        : "border-[var(--border-default,#202022)] bg-[var(--surface-input,#141414)] hover:border-[var(--border-focus,#444444)] hover:bg-[#1a1a1c]"
                    }`}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-black/40">
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[var(--accent,#D8FF3E)]">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <span className="truncate max-w-[80px] text-[10px] font-semibold text-[var(--text-secondary,#999999)] group-hover:text-[var(--text-primary,#F5F5F5)]">
                      {avatar.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
