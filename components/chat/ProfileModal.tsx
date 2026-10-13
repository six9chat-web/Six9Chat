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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Top Banner */}
          <div className="h-28 bg-gradient-to-r from-[#1DB980]/30 via-[#8E24AA]/30 to-[#0070F3]/30 relative p-4 flex justify-between items-start">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-medium text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Six9 Chat Authenticated</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-900/80 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Avatar Overlay */}
          <div className="px-6 -mt-12 relative flex items-end justify-between">
            <div className="relative">
              <div className="w-24 h-24 rounded-full ring-4 ring-[#0F172A] bg-gradient-to-tr from-[#1DB980] to-[#0070F3] flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
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
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#1DB980] ring-4 ring-[#0F172A]" />
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="mb-2 px-3.5 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
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
                <span className="text-xs text-slate-400 font-mono">
                  ID: {currentUser.id.slice(0, 8)}...
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-slate-400 hover:text-white transition"
                  title="Copy User ID"
                >
                  {copiedId ? (
                    <Check className="w-3 h-3 text-[#1DB980]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
              {/* Status Line */}
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-slate-400 font-medium block mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#1DB980]" />
                  <span>About / Status</span>
                </span>
                <p className="text-slate-200 text-sm font-medium">
                  {currentUser.statusText || "Hey there! I am using Six9Chat"}
                </p>
              </div>

              {/* Phone Line */}
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-slate-400 font-medium block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#0070F3]" />
                  <span>Phone Number</span>
                </span>
                <p className="text-slate-200 text-sm font-mono">
                  {currentUser.phone || "Not connected to SMS"}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-3 rounded-xl bg-slate-800/80 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/40 border border-slate-700/80 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Disconnect & End Session</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
