"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LogOut,
  Phone,
  Video,
  ShieldCheck,
  Check,
  Camera,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  AtSign,
  Sparkles,
  Eye,
  Upload,
  MessageSquare,
  AlertCircle,
  Globe,
} from "lucide-react";
import { UserProfile, ChatContact } from "@/types/chat";
import { uploadAvatar, checkUsername } from "@/lib/auth";
import { Avatar, DefaultAvatarSilhouette } from "@/components/ui/Avatar";
import { LanguageSelector } from "@/components/auth/LanguageSelector";
import { useTranslation } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | ChatContact;
  currentUserId?: string;
  isOwnProfile?: boolean;
  onSignOut?: () => void;
  onUpdateProfile?: (data: {
    name: string;
    avatar: string;
    statusText: string;
    username?: string;
  }) => Promise<void>;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  currentUserId,
  isOwnProfile = true,
  onSignOut,
  onUpdateProfile,
  onVoiceCall,
  onVideoCall,
}: ProfileModalProps) {
  const { t } = useTranslation();

  // 1. Profile Owner vs Contact View Detection
  // Check if displayed profile ID matches currently logged-in user ID (isOwn = currentUserId === targetUserId)
  const targetUserId = currentUser?.id || "";
  const isOwn = currentUserId && targetUserId
    ? currentUserId === targetUserId
    : Boolean(isOwnProfile);
  // Avatar & upload states
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Modals & Menu states
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDpMenuOpen, setIsDpMenuOpen] = useState(false);
  const [isViewDpOpen, setIsViewDpOpen] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // User Record
  const userRecord = currentUser as unknown as Record<string, unknown>;
  const currentUsername =
    (typeof userRecord.username === "string" && userRecord.username ? userRecord.username : null) ||
    currentUser.name ||
    "user";

  const initialAbout =
    (typeof userRecord.statusText === "string" ? userRecord.statusText : null) ||
    (typeof userRecord.about === "string" ? userRecord.about : null) ||
    (typeof userRecord.status === "string" && userRecord.status !== "online" && userRecord.status !== "offline"
      ? (userRecord.status as string)
      : null) ||
    "Hey there! I am using Six9Chat 🚀";

  const userEmail =
    (typeof userRecord.email === "string" ? userRecord.email : null) ||
    (typeof userRecord.phone === "string" ? userRecord.phone : "") ||
    "you@six9chat.com";

  // Editable fields in state
  const [nameDisplay, setNameDisplay] = useState(currentUser.name || currentUsername);
  const [usernameDisplay, setUsernameDisplay] = useState(
    currentUsername.replace(/^@/, "")
  );
  const [aboutDisplay, setAboutDisplay] = useState(initialAbout);

  // Edit Username Modal State
  const [editUsernameInput, setEditUsernameInput] = useState(currentUsername.replace(/^@/, ""));
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Edit About Modal State
  const [editAboutInput, setEditAboutInput] = useState(initialAbout);
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [aboutError, setAboutError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dpMenuRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state when currentUser changes (adjust state during render)
  const [prevUserKey, setPrevUserKey] = useState(
    `${currentUser?.id}_${currentUsername}_${initialAbout}`
  );
  if (prevUserKey !== `${currentUser?.id}_${currentUsername}_${initialAbout}`) {
    setPrevUserKey(`${currentUser?.id}_${currentUsername}_${initialAbout}`);
    setNameDisplay(currentUser.name || currentUsername);
    setUsernameDisplay(currentUsername.replace(/^@/, ""));
    setAboutDisplay(initialAbout);
    setEditUsernameInput(currentUsername.replace(/^@/, ""));
    setEditAboutInput(initialAbout);
  }

  // Close DP menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dpMenuRef.current && !dpMenuRef.current.contains(event.target as Node)) {
        setIsDpMenuOpen(false);
      }
    }
    if (isDpMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDpMenuOpen]);

  // Realtime username check for the edit modal
  const handleUsernameInputChange = (val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9_]/g, "");
    setEditUsernameInput(clean);
    setUsernameError(null);

    // If it equals their current username, it's valid
    if (clean.toLowerCase() === currentUsername.toLowerCase()) {
      setUsernameAvailable(true);
      setUsernameSuggestions([]);
      setIsCheckingUsername(false);
      return;
    }

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (clean.length < 3) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await checkUsername(clean);
        setUsernameAvailable(res.available);
        setUsernameSuggestions(res.available ? [] : res.suggestions);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 250);
  };

  // Save new username
  const handleSaveUsername = async () => {
    const clean = editUsernameInput.trim().replace(/[^a-zA-Z0-9_]/g, "");
    if (!clean || clean.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return;
    }

    setIsSavingUsername(true);
    setUsernameError(null);

    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          username: clean,
          fullName: clean.charAt(0).toUpperCase() + clean.slice(1),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update username.");
      }

      setNameDisplay(clean.charAt(0).toUpperCase() + clean.slice(1));
      setUsernameDisplay(clean);
      if (onUpdateProfile) {
        await onUpdateProfile({
          name: clean.charAt(0).toUpperCase() + clean.slice(1),
          avatar: previewAvatar || currentUser.avatar || "",
          statusText: aboutDisplay,
          username: clean,
        });
      }

      setIsUsernameModalOpen(false);
    } catch (err: unknown) {
      setUsernameError(err instanceof Error ? err.message : "Failed to update username.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Save new about text
  const handleSaveAbout = async () => {
    const clean = editAboutInput.trim();
    if (!clean) {
      setAboutError("About text cannot be empty.");
      return;
    }

    setIsSavingAbout(true);
    setAboutError(null);

    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          statusText: clean,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update about.");
      }

      setAboutDisplay(clean);
      if (onUpdateProfile) {
        await onUpdateProfile({
          name: nameDisplay,
          avatar: previewAvatar || currentUser.avatar || "",
          statusText: clean,
        });
      }

      setIsAboutModalOpen(false);
    } catch (err: unknown) {
      setAboutError(err instanceof Error ? err.message : "Failed to update about.");
    } finally {
      setIsSavingAbout(false);
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewAvatar(localUrl);
    setIsUploading(true);
    setUploadError(null);
    setIsDpMenuOpen(false);

    try {
      const publicUrl = await uploadAvatar(currentUser.id, file);

      await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          avatarUrl: publicUrl,
        }),
      });

      if (onUpdateProfile) {
        await onUpdateProfile({
          name: nameDisplay,
          avatar: publicUrl,
          statusText: aboutDisplay,
        });
      }
      setPreviewAvatar(null);
    } catch (err: unknown) {
      setPreviewAvatar(null);
      setUploadError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete Photo Handler
  const handleRemovePhoto = async () => {
    if (!isOwnProfile) return;
    setIsUploading(true);
    setUploadError(null);
    setPreviewAvatar(null);
    setIsDpMenuOpen(false);

    try {
      await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          avatarUrl: "",
        }),
      });

      if (onUpdateProfile) {
        await onUpdateProfile({
          name: nameDisplay,
          avatar: "",
          statusText: aboutDisplay,
        });
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to delete photo");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const currentAvatar = previewAvatar || currentUser.avatar || "";
  const isCustomImage =
    currentAvatar.startsWith("http") || currentAvatar.startsWith("data:");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[#086288] border border-[#4D8DBA]/60 rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] text-slate-100 custom-scrollbar"
        >
          {/* Top Banner (Clutter-free, zero UID badges) */}
          <div className="h-28 bg-gradient-to-r from-[#086288] via-[#4D8DBA] to-[#97D7FF] relative p-4 flex justify-between items-start">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#053b53]/90 border border-[#4D8DBA]/60 text-xs font-medium text-[#FFEFC4] shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isOwn ? "My Six9 Profile" : "Contact Information"}</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#053b53]/80 text-slate-200 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Avatar Section */}
          <div className="px-6 -mt-12 relative flex items-end justify-between">
            <div className="relative" ref={dpMenuRef}>
              {/* Hidden file input for photo upload */}
              {isOwn && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              )}

              {/* Circular DP */}
              <div
                onClick={() => {
                  if (isOwn) {
                    setIsDpMenuOpen((prev) => !prev);
                  } else if (isCustomImage) {
                    setIsViewDpOpen(true);
                  }
                }}
                className={cn(
                  "w-24 h-24 rounded-full ring-4 ring-[#086288] bg-gradient-to-tr from-[#086288] to-[#97D7FF] flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden relative select-none",
                  isOwn && "cursor-pointer hover:ring-[#97D7FF] transition-all"
                )}
                role="button"
                tabIndex={0}
                title={isOwn ? "Profile picture options" : currentUser.name}
              >
                <Avatar
                  src={isCustomImage ? currentAvatar : null}
                  alt={currentUser.name}
                  className="w-full h-full"
                  iconClassName="w-14 h-14 text-slate-200"
                />

                {/* Loading state indicator */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center z-20">
                    <Loader2 className="w-6 h-6 text-[#97D7FF] animate-spin mb-1" />
                    <span className="text-[9px] font-semibold text-[#FFEFC4]">Updating...</span>
                  </div>
                )}
              </div>

              {/* Online indicator */}
              {currentUser.status === "online" && (
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#97D7FF] ring-4 ring-[#086288] z-20 pointer-events-none" />
              )}

              {/* Camera Icon Button */}
              {isOwn && (
                <button
                  type="button"
                  onClick={() => setIsDpMenuOpen((prev) => !prev)}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#97D7FF] hover:bg-[#b4e3ff] text-[#086288] shadow-lg ring-2 ring-[#086288] transition-transform hover:scale-110 active:scale-95 cursor-pointer z-30"
                  title="Photo options"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}

              {/* Profile Picture Popup Menu */}
              <AnimatePresence>
                {isDpMenuOpen && isOwn && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-48 bg-[#032433] border border-[#4D8DBA]/60 rounded-2xl p-1.5 shadow-2xl z-40 backdrop-blur-xl"
                  >
                    {isCustomImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDpMenuOpen(false);
                          setIsViewDpOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#053b53] rounded-xl transition cursor-pointer text-left"
                      >
                        <Eye className="w-4 h-4 text-[#97D7FF]" />
                        <span>View Photo</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsDpMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#053b53] rounded-xl transition cursor-pointer text-left"
                    >
                      <Upload className="w-4 h-4 text-[#97D7FF]" />
                      <span>Upload Photo</span>
                    </button>

                    {isCustomImage && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 rounded-xl transition cursor-pointer text-left"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Delete Photo</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="mx-6 mt-3 p-2 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs">
              {uploadError}
            </div>
          )}

          {/* User Details */}
          <div className="p-6 pt-4 space-y-4">
            {/* Username / Name Row (Clean Single Appearance, Zero Duplication) */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5 font-mono">
                  {usernameDisplay}
                </h2>
              </div>

              {isOwn && (
                <button
                  type="button"
                  onClick={() => {
                    setEditUsernameInput(usernameDisplay);
                    setUsernameAvailable(true);
                    setUsernameSuggestions([]);
                    setUsernameError(null);
                    setIsUsernameModalOpen(true);
                  }}
                  className="p-2 text-slate-300 hover:text-[#97D7FF] bg-[#053b53] hover:bg-[#053b53]/80 border border-[#4D8DBA]/40 rounded-xl transition cursor-pointer"
                  title="Edit username"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t border-[#4D8DBA]/35 text-xs">
              {/* About / Status Box */}
              <div className="bg-[#053b53] p-3.5 rounded-2xl border border-[#4D8DBA]/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#97D7FF]" />
                    <span>{t("statusAbout", "About / Status")}</span>
                  </span>
                  {isOwn && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditAboutInput(aboutDisplay);
                        setAboutError(null);
                        setIsAboutModalOpen(true);
                      }}
                      className="p-1 text-slate-300 hover:text-[#97D7FF] transition cursor-pointer rounded-lg"
                      title="Edit about"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[#FFEFC4] text-sm font-medium leading-relaxed">
                  {aboutDisplay}
                </p>
              </div>

              {/* Clean Email Address Box - Completely hidden when viewing another user's profile */}
              {isOwn && (
                <div className="bg-[#053b53] p-3.5 rounded-2xl border border-[#4D8DBA]/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5 text-xs">
                      <Mail className="w-3.5 h-3.5 text-[#97D7FF]" />
                      <span>{t("email", "Email Address")}</span>
                    </span>
                  </div>
                  <p className="text-sm font-mono text-slate-100 pt-1 select-all truncate">
                    {userEmail}
                  </p>
                </div>
              )}

              {/* Language Selection Box - Completely hidden when viewing another user's profile */}
              {isOwn && (
                <div className="bg-[#053b53] p-3.5 rounded-2xl border border-[#4D8DBA]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5 text-xs">
                      <Globe className="w-3.5 h-3.5 text-[#97D7FF]" />
                      <span>{t("language", "Language")}</span>
                    </span>
                  </div>
                  <LanguageSelector direction="up" />
                </div>
              )}
            </div>

            {/* Bottom Actions: Single Main Log Out button (for own profile) or Voice/Video Call (for contact view) */}
            <div className="pt-2">
              {isOwn ? (
                onSignOut && (
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/60 text-red-200 hover:text-white text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
                  >
                    <LogOut className="w-4 h-4 text-red-300" />
                    <span>{t("signOut", "Log Out")}</span>
                  </button>
                )
              ) : (
                /* Contact call actions */
                <div className="flex items-center gap-2">
                  {onVoiceCall && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onVoiceCall();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#053b53] hover:bg-[#4D8DBA]/30 border border-[#4D8DBA]/40 text-slate-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-[#97D7FF]" />
                      <span>Voice Call</span>
                    </button>
                  )}
                  {onVideoCall && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onVideoCall();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#053b53] hover:bg-[#4D8DBA]/30 border border-[#4D8DBA]/40 text-slate-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-[#97D7FF]" />
                      <span>Video Call</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* 1. EDIT USERNAME MODAL (Live Real-time Supabase Check) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isUsernameModalOpen && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setIsUsernameModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-sm bg-[#086288] border border-[#4D8DBA]/80 rounded-3xl p-6 shadow-2xl text-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AtSign className="w-5 h-5 text-[#97D7FF]" />
                    <h3 className="text-lg font-bold text-white">Edit Username</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUsernameModalOpen(false)}
                    className="p-1 rounded-full text-slate-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-200 mb-4 leading-relaxed">
                  Enter a unique username. Other members can find and chat with you using this handle.
                </p>

                {usernameError && (
                  <div className="mb-3 p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{usernameError}</span>
                  </div>
                )}

                {/* Username Input with Tick Mark Indicator */}
                <div className="relative flex items-center mb-2">
                  <AtSign className="w-4 h-4 text-[#97D7FF] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={editUsernameInput}
                    onChange={(e) => handleUsernameInputChange(e.target.value)}
                    placeholder="e.g. alexrivers"
                    autoFocus
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#053b53] border border-[#4D8DBA]/60 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                  />
                  <div className="absolute right-3 flex items-center justify-center">
                    {isCheckingUsername ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : usernameAvailable === true ? (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full text-slate-500">
                        <Check className="w-4 h-4 stroke-[2]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggestions if Taken */}
                {usernameAvailable === false && usernameSuggestions.length > 0 && (
                  <div className="mb-4 p-2.5 rounded-xl bg-[#032433] border border-[#4D8DBA]/40 text-xs">
                    <p className="text-slate-300 text-[11px] mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FFEFC4]" />
                      <span>Username taken. Try these:</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {usernameSuggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setEditUsernameInput(sug);
                            setUsernameAvailable(true);
                            setUsernameSuggestions([]);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-[#053b53] hover:bg-[#97D7FF] text-[#FFEFC4] hover:text-[#086288] border border-[#4D8DBA]/50 font-mono text-[11px] font-bold transition cursor-pointer"
                        >
                          @{sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsUsernameModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#053b53] hover:bg-[#4D8DBA]/30 border border-[#4D8DBA]/40 text-slate-200 hover:text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUsername}
                    disabled={isSavingUsername || isCheckingUsername || usernameAvailable === false}
                    className="flex-1 py-2.5 rounded-xl bg-[#97D7FF] hover:bg-[#b4e3ff] text-[#086288] font-bold text-xs shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSavingUsername ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save Username</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 2. EDIT ABOUT / STATUS MODAL */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isAboutModalOpen && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setIsAboutModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-sm bg-[#086288] border border-[#4D8DBA]/80 rounded-3xl p-6 shadow-2xl text-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#97D7FF]" />
                    <h3 className="text-lg font-bold text-white">Edit About</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAboutModalOpen(false)}
                    className="p-1 rounded-full text-slate-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-200 mb-3 leading-relaxed">
                  Update your bio or status message visible to contacts.
                </p>

                {aboutError && (
                  <div className="mb-3 p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{aboutError}</span>
                  </div>
                )}

                <div className="mb-2">
                  <textarea
                    rows={3}
                    maxLength={120}
                    value={editAboutInput}
                    onChange={(e) => setEditAboutInput(e.target.value)}
                    placeholder="Hey there! I am using Six9Chat 🚀"
                    autoFocus
                    className="w-full p-3 rounded-xl bg-[#053b53] border border-[#4D8DBA]/60 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition resize-none"
                  />
                  <div className="text-right text-[11px] text-slate-300 mt-1">
                    {editAboutInput.length}/120
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAboutModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#053b53] hover:bg-[#4D8DBA]/30 border border-[#4D8DBA]/40 text-slate-200 hover:text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAbout}
                    disabled={isSavingAbout || !editAboutInput.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#97D7FF] hover:bg-[#b4e3ff] text-[#086288] font-bold text-xs shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSavingAbout ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save About</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 3. FULL VIEW PROFILE PICTURE MODAL (Lightbox) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isViewDpOpen && (
            <div
              className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
              onClick={() => setIsViewDpOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-lg w-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex justify-between items-center mb-3 px-2">
                  <span className="text-sm font-bold text-white tracking-wide">
                    {nameDisplay}&apos;s Profile Picture
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsViewDpOpen(false)}
                    className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden ring-4 ring-[#4D8DBA]/80 shadow-2xl bg-[#032433] flex items-center justify-center">
                  {isCustomImage ? (
                    <img
                      src={currentAvatar}
                      alt={nameDisplay}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <DefaultAvatarSilhouette className="w-36 h-36 text-slate-300" />
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 4. LOG OUT CONFIRMATION MODAL */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-sm bg-[#086288] border border-[#4D8DBA]/80 rounded-3xl p-6 shadow-2xl text-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 flex items-center justify-center mb-4 shadow-inner">
                    <LogOut className="w-7 h-7 text-red-300" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Log Out</h3>
                  <p className="text-xs text-slate-200 mb-6 leading-relaxed">
                    Are you sure you want to log out? You will need to sign in again to access your chats.
                  </p>

                  <div className="flex items-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-[#053b53] hover:bg-[#4D8DBA]/30 border border-[#4D8DBA]/40 text-slate-200 hover:text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLogoutConfirm(false);
                        onClose();
                        onSignOut?.();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-900/40 transition cursor-pointer active:scale-98"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}

export const ContactInfoModal = ProfileModal;
export const UserProfileModal = ProfileModal;
export default ProfileModal;
