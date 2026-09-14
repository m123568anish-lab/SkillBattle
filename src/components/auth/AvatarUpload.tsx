"use client";

import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AI_AVATARS } from "@/lib/avatars";

interface AvatarUploadProps {
  value?: string;
  onChange?: (avatarUrl: string) => void;
}

export default function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);

  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    value || AI_AVATARS[0].url
  );

  useEffect(() => {
    if (value) setSelectedAvatar(value);
  }, [value]);

  function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    setPreview(url);
    setSelectedAvatar(null);
    onChange?.(url);
  }

  function chooseAvatar(path: string) {
    setSelectedAvatar(path);
    setPreview(null);
    onChange?.(path);
  }

  return (
    <div className="space-y-6">

      {/* Current Avatar */}

      <div className="flex justify-center">

        <div
          onClick={() => inputRef.current?.click()}
          className="relative h-28 w-28 cursor-pointer overflow-hidden rounded-full border-2 border-cyan-500 bg-white/5"
        >
          {preview ? (
            <img
              src={preview}
              alt="avatar"
              className="h-full w-full object-cover"
            />
          ) : selectedAvatar ? (
            <img
              src={selectedAvatar}
              alt="avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Camera size={34} />
            </div>
          )}
        </div>

      </div>

      <input
        hidden
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
      />

      {/* Upload */}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-3 text-cyan-300 transition hover:bg-cyan-500/20"
      >
        Upload Your Photo
      </button>

      {/* Divider */}

      <div className="relative text-center">

        <div className="absolute left-0 top-1/2 h-px w-full bg-white/10" />

        <span className="relative bg-[#070B14] px-4 text-sm text-slate-400">
          OR CHOOSE AN AVATAR
        </span>

      </div>

      {/* Avatar Grid */}

      <div className="grid grid-cols-4 gap-3">

        {AI_AVATARS.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => chooseAvatar(avatar.url)}
            className={`relative h-16 w-16 overflow-hidden rounded-full border transition ${
              selectedAvatar === avatar.url
                ? "border-cyan-500 ring-2 ring-cyan-500"
                : "border-white/10"
            }`}
          >
            <img
              src={avatar.url}
              alt={avatar.name}
              className="h-full w-full object-cover"
            />
          </button>
        ))}

      </div>

    </div>
  );
}