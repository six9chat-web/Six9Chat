"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LogOut,
  Phone,
  Video,
  MessageSquare,
  ShieldCheck,
  Check,
  Camera,
  Pencil,
  Trash2,
  Loader2,
  Fingerprint,
  Copy,
  Mail,
} from "lucide-react";
import { UserProfile, ChatContact } from "@/types/chat";
import { uploadAvatar, getCurrentUserUid } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | ChatContact;
  isOwnProfile?: boolean;
  onSignOut?: () => void;
  onUpdateProfile?: (data: {
    name: string;
    avatar: string;
    statusText: string;
  }) => Promise<void>;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  isOwnProfile = true,
  onSignOut,
  onUpdateProfile,
  onVoiceCall,
  onVideoCall,
}: ProfileModalProps) {
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Editable fields for own profile
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(currentUser.name || "");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const userRecord = currentUser as unknown as Record<string, unknown>;
  const initialAbout =
    (typeof userRecord.statusText === "string" ? userRecord.statusText : null) ||
    (typeof userRecord.about === "string" ? userRecord.about : null) ||
    "Hey there! I am using Six9Chat 🚀";
  const [aboutValue, setAboutValue] = useState(initialAbout);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const displayUid =
    (typeof userRecord.uid === "string" && userRecord.uid ? userRecord.uid : null) ||
    getCurrentUserUid(currentUser.id);

  const userEmail = (typeof userRecord.email === "string" ? userRecord.email : null) || "";

  const handleCopyUid = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(displayUid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentAvatar = previewAvatar || currentUser.avatar || "";
  const isCustomImage =
    currentAvatar.startsWith("http") || currentAvatar.startsWith("data:");

  // Upload or change avatar (Own profile only)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB");
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewAvatar(localUrl);

    setIsUploading(true);
    setUploadError(null);

    try {
      const publicUrl = await uploadAvatar(currentUser.id, file);
      if (onUpdateProfile) {
        await onUpdateProfile({
          name: nameValue || currentUser.name,
          avatar: publicUrl,
          statusText: aboutValue,
        });
      }
      setPreviewAvatar(null);
    } catch (err: unknown) {
      setPreviewAvatar(null);
      const msg = err instanceof Error ? err.message : "Failed to upload photo";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remove custom photo (revert to initials)
  const handleRemovePhoto = async () => {
    if (!isOwnProfile) return;
    setIsUploading(true);
    setUploadError(null);
    setPreviewAvatar(null);

    const defaultInitials =
      currentUser.name?.slice(0, 2).toUpperCase() || "ME";
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          name: nameValue || currentUser.name,
          avatar: defaultInitials,
          statusText: aboutValue,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove photo";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Save updated name
  const handleSaveName = async () => {
    if (!nameValue.trim() || !isOwnProfile) return;
    setIsSavingDetails(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          name: nameValue.trim(),
          avatar: currentAvatar,
          statusText: aboutValue,
        });
      }
      setIsEditingName(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update name";
      setUploadError(msg);
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Save updated about
  const handleSaveAbout = async () => {
    if (!aboutValue.trim() || !isOwnProfile) return;
    setIsSavingDetails(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          name: nameValue || currentUser.name,
          avatar: currentAvatar,
          statusText: aboutValue.trim(),
        });
      }
      setIsEditingAbout(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update about";
      setUploadError(msg);
    } finally {
      setIsSavingDetails(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[#086288] border border-[#4D8DBA]/60 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Top Banner */}
          <div className="h-28 bg-gradient-to-r from-[#086288] via-[#4D8DBA] to-[#97D7FF] relative p-4 flex justify-between items-start">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#053b53]/90 border border-[#4D8DBA]/60 text-xs font-medium text-[#FFEFC4] shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {isOwnProfile ? "My Six9 Profile" : "Contact Information"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#032433]/90 border border-[#97D7FF]/50 text-xs font-mono font-bold text-[#FFEFC4] shadow-sm backdrop-blur-sm">
                <Fingerprint className="w-3.5 h-3.5 text-[#97D7FF]" />
                <span>UID: {displayUid}</span>
              </div>
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
            <div className="relative group">
              {/* Hidden file input for photo upload */}
              {isOwnProfile && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              )}

              {/* Circular DP - Clickable on own profile with WhatsApp camera hover overlay */}
              <div
                onClick={() => {
                  if (isOwnProfile && !isUploading) {
                    fileInputRef.current?.click();
                  }
                }}
                className={cn(
                  "w-24 h-24 rounded-full ring-4 ring-[#086288] bg-gradient-to-tr from-[#086288] to-[#97D7FF] flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden relative select-none",
                  isOwnProfile && "cursor-pointer group hover:ring-[#97D7FF] transition-all"
                )}
                role={isOwnProfile ? "button" : undefined}
                tabIndex={isOwnProfile ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isOwnProfile && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                title={isOwnProfile ? "Click to change profile photo" : currentUser.name}
              >
                {isCustomImage ? (
                  <img
                    src={currentAvatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <span>{currentAvatar}</span>
                )}

                {/* WhatsApp-style Camera Hover Overlay for Own Profile */}
                {isOwnProfile && !isUploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-1 text-white z-10 pointer-events-none">
                    <Camera className="w-5 h-5 mb-0.5 text-[#97D7FF]" />
                    <span className="text-[9px] font-bold tracking-wider uppercase text-white/95 leading-tight">
                      Change Photo
                    </span>
                  </div>
                )}

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

              {/* OWN PROFILE: WhatsApp Camera Edit Button */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#97D7FF] hover:bg-[#b4e3ff] text-[#086288] shadow-lg ring-2 ring-[#086288] transition-transform hover:scale-110 active:scale-95 cursor-pointer z-30"
                  title="Change profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right side controls: Logout for self, or Remove Photo button */}
            <div className="flex items-center gap-2 mb-2">
              {isOwnProfile && isCustomImage && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isUploading}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-400/40 bg-[#053b53]/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Remove custom photo"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden xs:inline">Remove</span>
                </button>
              )}

              {isOwnProfile && onSignOut && (
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-red-400/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="mx-6 mt-3 p-2 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs">
              {uploadError}
            </div>
          )}

          {/* User Details */}
          <div className="p-6 pt-3 space-y-4">
            {/* Name Row */}
            <div>
              {isOwnProfile && isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="flex-1 bg-[#053b53] border border-[#97D7FF] rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isSavingDetails}
                    className="p-2 rounded-xl bg-[#97D7FF] text-[#086288] hover:bg-white transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNameValue(currentUser.name);
                      setIsEditingName(false);
                    }}
                    className="p-2 rounded-xl bg-[#053b53] text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {currentUser.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-[#97D7FF] bg-[#053b53] px-2.5 py-0.5 rounded-full border border-[#4D8DBA]/50">
                        UID: {displayUid}
                      </span>
                      {userEmail && (
                        <span className="text-[11px] text-slate-300 font-mono truncate max-w-[180px]">
                          {userEmail}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 text-slate-300 hover:text-[#97D7FF] transition cursor-pointer rounded-lg hover:bg-[#053b53]"
                      title="Edit name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t border-[#4D8DBA]/35 text-xs">
              {/* About / Status Line */}
              <div className="bg-[#053b53] p-3 rounded-2xl border border-[#4D8DBA]/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#97D7FF]" />
                    <span>About / Status</span>
                  </span>
                  {isOwnProfile && !isEditingAbout && (
                    <button
                      type="button"
                      onClick={() => setIsEditingAbout(true)}
                      className="text-slate-300 hover:text-[#97D7FF] transition cursor-pointer"
                      title="Edit about"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {isOwnProfile && isEditingAbout ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={aboutValue}
                      onChange={(e) => setAboutValue(e.target.value)}
                      className="flex-1 bg-[#032433] border border-[#97D7FF] rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveAbout}
                      disabled={isSavingDetails}
                      className="p-1.5 rounded-lg bg-[#97D7FF] text-[#086288] hover:bg-white transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAboutValue(initialAbout);
                        setIsEditingAbout(false);
                      }}
                      className="p-1.5 rounded-lg bg-[#086288] text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[#FFEFC4] text-sm font-medium">
                    {aboutValue}
                  </p>
                )}
              </div>

              {/* System Unique ID (UID) Card */}
              <div className="bg-[#053b53] p-3.5 rounded-2xl border border-[#4D8DBA]/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-[#97D7FF]" />
                    <span>System Unique ID (UID)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#97D7FF]/20 text-[#97D7FF] border border-[#97D7FF]/30 font-medium">
                    Session UID
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-base font-extrabold text-[#FFEFC4] tracking-widest px-2.5 py-1 rounded-xl bg-[#032433] border border-[#4D8DBA]/50 shadow-inner select-all">
                    {displayUid}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    className="px-2.5 py-1 rounded-lg bg-[#4D8DBA]/30 hover:bg-[#97D7FF]/30 text-[#97D7FF] hover:text-white text-xs font-bold border border-[#97D7FF]/40 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Copy UID"
                  >
                    {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUid ? "Copied" : "Copy UID"}</span>
                  </button>
                </div>
              </div>

              {/* Connected Email (if available) */}
              {userEmail ? (
                <div className="bg-[#053b53] p-3 rounded-2xl border border-[#4D8DBA]/40">
                  <span className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#97D7FF]" />
                    <span>Gmail / Email</span>
                  </span>
                  <p className="text-slate-100 text-sm font-mono truncate">
                    {userEmail}
                  </p>
                </div>
              ) : currentUser.phone ? (
                <div className="bg-[#053b53] p-3 rounded-2xl border border-[#4D8DBA]/40">
                  <span className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#97D7FF]" />
                    <span>Connected Device</span>
                  </span>
                  <p className="text-slate-100 text-sm font-mono">
                    {currentUser.phone}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              {isOwnProfile ? (
                /* Self: Prominent Clean Log Out Button */
                onSignOut && (
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/60 text-red-200 hover:text-white text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
                  >
                    <LogOut className="w-4 h-4 text-red-300" />
                    <span>Log Out</span>
                  </button>
                )
              ) : (
                /* Other User (Contact): Quick Call Actions (Strictly Read-Only) */
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

        {/* Log Out Confirmation Modal */}
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
                  <h3 className="text-lg font-bold text-white mb-2">
                    Log Out
                  </h3>
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
