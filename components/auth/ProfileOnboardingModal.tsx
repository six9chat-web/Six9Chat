"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Check,
  Sparkles,
  User,
  Smile,
  Loader2,
  Upload,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface ProfileOnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const PRESET_AVATARS = [
  { id: "av-1", label: "Emerald 9", value: "9", bg: "from-[#1DB980] to-[#0070F3]" },
  { id: "av-2", label: "Royal Six", value: "6", bg: "from-[#8E24AA] to-[#1E40AF]" },
  { id: "av-3", label: "Cyber Neon", value: "⚡", bg: "from-[#0070F3] to-[#1DB980]" },
  { id: "av-4", label: "Flame", value: "🔥", bg: "from-[#F59E0B] to-[#EF4444]" },
  { id: "av-5", label: "Cosmic", value: "🚀", bg: "from-[#8E24AA] to-[#EC4899]" },
  { id: "av-6", label: "Crown", value: "👑", bg: "from-[#10B981] to-[#3B82F6]" },
];

const PRESET_STATUSES = [
  "Hey there! I am using Six9Chat 🚀",
  "Available",
  "At work 💻",
  "In a meeting 📞",
  "Battery about to die 🪫",
  "Urgent calls only ⚠️",
];

export function ProfileOnboardingModal({
  isOpen,
  onComplete,
}: ProfileOnboardingModalProps) {
  const { user, profile, saveUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState(
    profile?.name && profile.name !== "Six9 Member" && !profile.name.startsWith("+")
      ? profile.name
      : user?.user_metadata?.full_name || ""
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    profile?.avatar || "9"
  );
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState(
    profile?.statusText || "Hey there! I am using Six9Chat 🚀"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage("Image file size must be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setCustomAvatarUrl(reader.result);
          setSelectedAvatar(reader.result);
          setErrorMessage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage("Please enter a display name.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const avatarToSave = customAvatarUrl || selectedAvatar;

    const { error } = await saveUserProfile({
      name: displayName.trim(),
      avatar: avatarToSave,
      statusText: statusText.trim(),
      phone: user?.phone,
    });

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message || "Failed to save profile. Please try again.");
    } else {
      onComplete();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#0F172A] border border-slate-700/90 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-left"
        >
          {/* Ambient Lighting Backdrop */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#1DB980]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-[#0070F3]/20 blur-3xl" />

          {/* Modal Header */}
          <div className="relative text-center pb-4 border-b border-slate-800">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1DB980]/15 text-[#1DB980] border border-[#1DB980]/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome to Six9Chat</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Create Your Profile
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose your Six9 Chat avatar and display name so your contacts recognize you.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="mt-5 space-y-5 relative">
            {/* Avatar Preview & Chooser */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#1DB980] via-[#0070F3] to-[#8E24AA] shadow-xl flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-2xl font-bold text-white">
                    {customAvatarUrl ? (
                      <img
                        src={customAvatarUrl}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{selectedAvatar}</span>
                    )}
                  </div>
                </div>

                {/* Upload Button overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-[#1DB980] text-black shadow-lg hover:scale-110 active:scale-95 transition"
                  title="Upload Custom Photo"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-950 font-bold" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Avatar Presets Grid */}
              <div className="mt-3.5 flex items-center gap-2">
                {PRESET_AVATARS.map((av) => {
                  const isSelected = !customAvatarUrl && selectedAvatar === av.value;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setCustomAvatarUrl(null);
                        setSelectedAvatar(av.value);
                      }}
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr ${av.bg} flex items-center justify-center text-sm font-bold text-white shadow transition transform hover:scale-110 ${
                        isSelected
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      title={av.label}
                    >
                      {av.value}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 hover:border-[#1DB980] text-slate-300 hover:text-white flex items-center justify-center transition"
                  title="Upload Custom Image"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Display Name Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Display Name
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {displayName.length}/25
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={25}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rivers"
                  className="w-full h-11 px-3.5 pl-9 rounded-xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] text-sm text-white placeholder-slate-400 outline-none transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Status / About Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                About / Status
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={60}
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder="Available"
                  className="w-full h-11 px-3.5 pl-9 rounded-xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] text-xs text-white placeholder-slate-400 outline-none transition"
                />
                <Smile className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Preset Pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESET_STATUSES.slice(0, 4).map((st, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStatusText(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${
                      statusText === st
                        ? "bg-[#1DB980]/20 text-[#1DB980] border border-[#1DB980]/40"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving || !displayName.trim()}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Setup & Enter Six9Chat</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
