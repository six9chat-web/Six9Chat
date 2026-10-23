"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Sparkles,
  User,
  Smile,
  Loader2,
  Upload,
  ShieldCheck,
  AlertCircle,
  Fingerprint,
} from "lucide-react";
import { useAuth, uploadAvatar } from "@/lib/auth";
import { DefaultAvatarSilhouette } from "@/components/ui/Avatar";

interface ProfileOnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const PRESET_AVATARS = [
  { id: "av-1", label: "Ocean Blue", value: "9", bg: "from-[#086288] to-[#97D7FF]" },
  { id: "av-2", label: "Warm Cream", value: "6", bg: "from-[#4D8DBA] to-[#FFEFC4]" },
  { id: "av-3", label: "Cyber Light", value: "⚡", bg: "from-[#086288] to-[#4D8DBA]" },
  { id: "av-4", label: "Sun Accent", value: "🔥", bg: "from-[#4D8DBA] to-[#97D7FF]" },
  { id: "av-5", label: "Deep Glow", value: "🚀", bg: "from-[#053b53] to-[#FFEFC4]" },
  { id: "av-6", label: "Crown Gold", value: "👑", bg: "from-[#086288] via-[#4D8DBA] to-[#97D7FF]" },
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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Image file size must be less than 5MB.");
        return;
      }
      setIsSaving(true);
      setErrorMessage(null);
      try {
        if (user?.id) {
          const publicUrl = await uploadAvatar(user.id, file);
          setCustomAvatarUrl(publicUrl);
          setSelectedAvatar(publicUrl);
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              setCustomAvatarUrl(reader.result);
              setSelectedAvatar(reader.result);
            }
          };
          reader.readAsDataURL(file);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to upload photo";
        setErrorMessage(msg);
      } finally {
        setIsSaving(false);
      }
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
          className="relative w-full max-w-lg bg-[#086288] border border-[#4D8DBA]/60 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-left"
        >
          {/* Ambient Lighting Backdrop */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#4D8DBA]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-[#97D7FF]/20 blur-3xl" />

          {/* Modal Header */}
          <div className="relative text-center pb-4 border-b border-[#4D8DBA]/35">
            <div className="inline-flex items-center gap-2 mb-2 flex-wrap justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#97D7FF]/20 text-[#FFEFC4] border border-[#4D8DBA]/50 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Welcome to Six9Chat</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#032433] text-[#97D7FF] border border-[#97D7FF]/40 text-xs font-mono font-bold shadow-sm">
                <Fingerprint className="w-3.5 h-3.5 text-[#FFEFC4]" />
                <span>
                  UID:{" "}
                  {profile?.uid ||
                    (typeof window !== "undefined"
                      ? localStorage.getItem("six9_current_uid")
                      : null) ||
                    "S9-01"}
                </span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Create Your Profile
            </h2>
            <p className="text-xs text-slate-200 mt-1">
              Choose your Six9 Chat avatar and display name so your contacts recognize you.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="mt-5 space-y-5 relative">
            {/* Avatar Preview & Chooser */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#086288] via-[#4D8DBA] to-[#97D7FF] shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 transition"
                  title="Upload Custom Photo"
                >
                  <div className="w-full h-full rounded-full bg-[#053b53] overflow-hidden flex items-center justify-center text-2xl font-bold text-white">
                    {customAvatarUrl || (selectedAvatar && (selectedAvatar.startsWith("http") || selectedAvatar.startsWith("data:"))) ? (
                      <img
                        src={customAvatarUrl || selectedAvatar}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <DefaultAvatarSilhouette className="w-10 h-10 text-slate-200" />
                    )}
                  </div>
                </div>

                {/* Upload Button overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-[#97D7FF] text-[#086288] shadow-lg hover:scale-110 active:scale-95 transition"
                  title="Upload Custom Photo"
                >
                  <Camera className="w-3.5 h-3.5 font-bold" />
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
                          ? "ring-2 ring-[#FFEFC4] ring-offset-2 ring-offset-[#086288] scale-105"
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
                  className="w-9 h-9 rounded-full bg-[#053b53] border border-[#4D8DBA]/50 hover:border-[#97D7FF] text-slate-200 hover:text-white flex items-center justify-center transition"
                  title="Upload Custom Image"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Display Name Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Display Name
                </label>
                <span className="text-[11px] text-slate-300 font-mono">
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
                  className="w-full h-11 px-3.5 pl-9 rounded-xl bg-[#053b53] border border-[#4D8DBA]/50 hover:border-[#97D7FF] focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] text-sm text-white placeholder-slate-300 outline-none transition"
                />
                <User className="w-4 h-4 text-[#4D8DBA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Status / About Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                About / Status
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={60}
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder="Available"
                  className="w-full h-11 px-3.5 pl-9 rounded-xl bg-[#053b53] border border-[#4D8DBA]/50 hover:border-[#97D7FF] focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] text-xs text-white placeholder-slate-300 outline-none transition"
                />
                <Smile className="w-4 h-4 text-[#4D8DBA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                        ? "bg-[#97D7FF]/25 text-[#FFEFC4] border border-[#FFEFC4]/50"
                        : "bg-[#053b53] text-slate-300 hover:text-white border border-[#4D8DBA]/40"
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
                className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving || !displayName.trim()}
                className="w-full h-12 rounded-xl bg-[#97D7FF] hover:bg-[#b4e3ff] text-[#086288] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#086288]/40 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
