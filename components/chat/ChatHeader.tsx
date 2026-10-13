"use client";

import React, { useState } from "react";
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  ArrowLeft,
  Shield,
  BellOff,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { ChatContact } from "@/types/chat";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatHeaderProps {
  contact: ChatContact;
  isTyping?: boolean;
  onBackToSidebar?: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onToggleSearchInChat?: () => void;
  isSearchOpen?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export function ChatHeader({
  contact,
  isTyping = false,
  onBackToSidebar,
  onVoiceCall,
  onVideoCall,
  onToggleSearchInChat,
  isSearchOpen = false,
  searchQuery = "",
  onSearchChange,
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#0F172A]/95 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between z-20 shrink-0">
      {/* Left: Contact Info & Back Button */}
      <div className="flex items-center gap-3 min-w-0">
        {onBackToSidebar && (
          <button
            type="button"
            onClick={onBackToSidebar}
            className="md:hidden p-1.5 -ml-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Back to contacts list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Contact Avatar */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md bg-gradient-to-tr",
              contact.avatarColor || "from-[#1DB980] to-[#0070F3]"
            )}
          >
            {contact.avatar}
          </div>
          {contact.status === "online" && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#1DB980] ring-2 ring-[#0F172A]" />
          )}
        </div>

        {/* Name and Real-Time Status */}
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
            <span>{contact.name}</span>
            {contact.isGroup && (
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                Group
              </span>
            )}
          </h2>

          <div className="flex items-center gap-1.5 text-xs truncate">
            {isTyping ? (
              <span className="text-[#1DB980] font-medium flex items-center gap-1 animate-pulse">
                <span>typing</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-[#1DB980] animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-[#1DB980] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 rounded-full bg-[#1DB980] animate-bounce [animation-delay:0.4s]" />
                </span>
              </span>
            ) : contact.status === "online" ? (
              <span className="text-[#1DB980] font-medium">Online</span>
            ) : (
              <span className="text-slate-400">{contact.lastSeen || "Offline"}</span>
            )}
          </div>
        </div>
      </div>

      {/* In-Chat Search Bar Overlay (when activated) */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="hidden sm:flex items-center flex-1 max-w-xs mx-4"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search in conversation..."
                autoFocus
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-full px-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0070F3]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleSearchInChat}
          className={cn(
            "p-2 rounded-xl transition text-slate-400 hover:text-white hover:bg-slate-800/80",
            isSearchOpen && "text-[#0070F3] bg-slate-800"
          )}
          title="Search in chat"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={onVoiceCall}
          className="p-2 rounded-xl transition text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80"
          title="Voice Call"
        >
          <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={onVideoCall}
          className="p-2 rounded-xl transition text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80"
          title="Video Call"
        >
          <Video className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-2 rounded-xl transition text-slate-400 hover:text-white hover:bg-slate-800/80"
            title="More options"
          >
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-11 z-40 w-52 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl py-1.5 text-xs text-slate-200"
                >
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Contact: ${contact.name}\nPhone: ${contact.phone || "N/A"}\nAbout: ${contact.about || "Six9Chat User"}`);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-left transition"
                  >
                    <UserCheck className="w-4 h-4 text-[#1DB980]" />
                    <span>Contact Info</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMuted((prev) => !prev);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-left transition"
                  >
                    <BellOff className="w-4 h-4 text-amber-400" />
                    <span>{isMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      alert("Messages encrypted with Supabase RLS security.");
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 text-left transition"
                  >
                    <Shield className="w-4 h-4 text-[#0070F3]" />
                    <span>Encryption Details</span>
                  </button>

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Clear messages for this chat?")) {
                        window.location.reload();
                      }
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-950/40 text-rose-400 text-left transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Messages</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
