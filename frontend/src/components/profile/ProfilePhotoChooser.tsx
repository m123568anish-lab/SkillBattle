"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Trash2, Upload, Sparkles, Check, X } from "lucide-react";
import { profileService } from "@/services/profile.service";
import { useAuthStore } from "@/store/authStore";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateUserPartial = useAuthStore((s) => s.updateUserPartial);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "SB";
  };

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

      toast.success("Profile photo removed.");
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

  const displayAvatar = previewUrl || currentAvatar;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Avatar Preview Ring */}
      <div className="relative group flex-shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full blur opacity-75 group-hover:opacity-100 transition" />
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt={fullName}
            className="relative h-28 w-28 rounded-full border-4 border-slate-950 object-cover shadow-xl"
          />
        ) : (
          <div className="relative h-28 w-28 rounded-full border-4 border-slate-950 bg-gradient-to-br from-cyan-600 to-violet-700 flex items-center justify-center text-white font-black text-2xl shadow-xl">
            {getInitials(fullName)}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-1 right-1 rounded-full bg-cyan-500 p-2 text-slate-950 font-bold hover:scale-110 transition shadow-lg"
          title="Choose Photo"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {/* Controls & Actions */}
      <div className="flex-1 space-y-3 text-center sm:text-left">
        <div>
          <h4 className="text-base font-bold text-white">Profile Picture</h4>
          <p className="text-xs text-slate-400 mt-1">
            Choose a PNG, JPEG, WebP or GIF image from your device (Max 5 MB).
          </p>
        </div>

        {selectedFile ? (
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : "Save Photo"}
            </button>
            <button
              type="button"
              onClick={handleCancelPreview}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              <Camera className="h-3.5 w-3.5" /> Upload Photo
            </button>
            {currentAvatar && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
