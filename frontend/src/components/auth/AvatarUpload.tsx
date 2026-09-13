"use client";

import Image from "next/image";
import { Camera, Check, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { AI_AVATARS } from "@/lib/avatars";

interface AvatarUploadProps {
  value?: string;
  onChange?: (avatarUrl: string) => void;
}

export default function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    value || AI_AVATARS[0].url
  );

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    setSelectedAvatar(url);
    if (onChange) onChange(url);
  }

  function chooseAvatar(url: string) {
    setSelectedAvatar(url);
    setPreview(null);
    if (onChange) onChange(url);
  }

  const currentDisplay = preview || selectedAvatar;

  return (
    <div className="space-y-6">
      {/* Current Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div
          onClick={() => inputRef.current?.click()}
          className="group relative h-28 w-28 cursor-pointer overflow-hidden rounded-full border-2 border-cyan-500/80 bg-slate-900/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] transition hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
        >
          {currentDisplay ? (
            <img
              src={currentDisplay}
              alt="Avatar"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-cyan-400">
              <Camera size={34} />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </div>
        <p className="text-xs font-semibold text-cyan-400/80 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Selected AI Avatar
        </p>
      </div>

      <input
        hidden
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
      />

      {/* Upload Button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
      >
        Upload Custom Photo
      </button>

      {/* Divider */}
      <div className="relative text-center">
        <div className="absolute left-0 top-1/2 h-px w-full bg-white/10" />
        <span className="relative bg-[#070B14] px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          OR CHOOSE AN AI AVATAR
        </span>
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {AI_AVATARS.map((avatar) => {
          const isSelected = selectedAvatar === avatar.url && !preview;
          return (
            <button
              key={avatar.id}
              type="button"
              title={avatar.name}
              onClick={() => chooseAvatar(avatar.url)}
              className={`group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 transition ${
                isSelected
                  ? "border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "border-white/10 bg-slate-900/40 hover:border-white/30"
              }`}
            >
              <img
                src={avatar.url}
                alt={avatar.name}
                className="h-full w-full object-cover transition duration-200 group-hover:scale-110"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center">
                  <Check className="h-4 w-4 text-cyan-200 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}