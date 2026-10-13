"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LogOut,
  User,
  Phone,
  MessageSquare,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { UserProfile } from "@/types/chat";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSignOut: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onSignOut,
}: ProfileModalProps) {
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentUser.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isCustomImage =
    currentUser.avatar?.startsWith("http") ||
    currentUser.avatar?.startsWith("data:");

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
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#053b53]/90 border border-[#4D8DBA]/60 text-xs font-medium text-[#FFEFC4]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Six9 Chat Authenticated</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#053b53]/80 text-slate-200 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Avatar Overlay */}
          <div className="px-6 -mt-12 relative flex items-end justify-between">
            <div className="relative">
              <div className="w-24 h-24 rounded-full ring-4 ring-[#086288] bg-gradient-to-tr from-[#086288] to-[#97D7FF] flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
                {isCustomImage ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentUser.avatar}</span>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#97D7FF] ring-4 ring-[#086288]" />
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="mb-2 px-3.5 py-1.5 rounded-xl border border-red-400/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* User Details */}
          <div className="p-6 pt-3 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                {currentUser.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-300 font-mono">
                  ID: {currentUser.id.slice(0, 8)}...
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-slate-300 hover:text-white transition"
                  title="Copy User ID"
                >
                  {copiedId ? (
                    <Check className="w-3 h-3 text-[#FFEFC4]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#4D8DBA]/35 text-xs">
              {/* Status Line */}
              <div className="bg-[#053b53] p-3 rounded-2xl border border-[#4D8DBA]/40">
                <span className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#97D7FF]" />
                  <span>About / Status</span>
                </span>
                <p className="text-[#FFEFC4] text-sm font-medium">
                  {currentUser.statusText || "Hey there! I am using Six9Chat"}
                </p>
              </div>

              {/* Phone Line */}
              <div className="bg-[#053b53] p-3 rounded-2xl border border-[#4D8DBA]/40">
                <span className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#97D7FF]" />
                  <span>Phone Number</span>
                </span>
                <p className="text-slate-100 text-sm font-mono">
                  {currentUser.phone || "Not connected to SMS"}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-3 rounded-xl bg-[#053b53] hover:bg-red-500/25 hover:text-red-200 border border-[#4D8DBA]/40 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4 text-red-300" />
                <span>Disconnect & End Session</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
