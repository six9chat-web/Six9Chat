"use client";

import React, { useState } from "react";
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  ArrowLeft,
  X,
  BellOff,
  Trash2,
  UserCheck,
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
  onOpenContactInfo?: () => void;
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
  onOpenContactInfo,
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <header className="h-16 px-4 sm:px-5 bg-[#086288] border-b border-[#4D8DBA]/35 backdrop-blur-xl flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Contact Info (DP + Name + "click here for contact info") */}
      <div
        onClick={onOpenContactInfo}
        className="flex items-center gap-3 min-w-0 cursor-pointer group"
      >
        {onBackToSidebar && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBackToSidebar();
            }}
            className="md:hidden p-1.5 -ml-1 rounded-full text-slate-200 hover:text-white hover:bg-[#4D8DBA]/20 transition cursor-pointer"
            aria-label="Back to contacts list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Circular DP */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md bg-gradient-to-tr transition-transform group-hover:scale-105",
              contact.avatarColor || "from-[#086288] to-[#4D8DBA]"
            )}
          >
            {contact.avatar}
          </div>
          {contact.status === "online" && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#97D7FF] ring-2 ring-[#086288]" />
          )}
        </div>

        {/* Name + "click here for contact info" */}
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-[#FFEFC4] transition-colors">
            {contact.name}
          </h2>

          <p className="text-[11px] sm:text-xs text-slate-300 group-hover:text-[#97D7FF] truncate transition-colors leading-tight">
            {isTyping ? (
              <span className="text-[#97D7FF] font-medium animate-pulse">
                typing...
              </span>
            ) : (
              "click here for contact info"
            )}
          </p>
        </div>
      </div>

      {/* Right Action Buttons: Video call icon, Voice call icon, Search icon, Menu */}
      <div className="flex items-center gap-1 sm:gap-2 text-slate-200">
        {/* In-chat Search Input (Expandable) */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "180px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative hidden sm:flex items-center overflow-hidden"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search in chat..."
                className="w-full h-9 pl-3 pr-8 rounded-full bg-[#053b53] border border-[#4D8DBA]/50 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF]"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.("")}
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Video Call Button */}
        <button
          type="button"
          onClick={onVideoCall}
          className="p-2 sm:p-2.5 rounded-xl hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer text-slate-200"
          title="Video call"
        >
          <Video className="w-5 h-5" />
        </button>

        {/* 2. Voice Call Button */}
        <button
          type="button"
          onClick={onVoiceCall}
          className="p-2 sm:p-2.5 rounded-xl hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer text-slate-200"
          title="Voice call"
        >
          <Phone className="w-5 h-5" />
        </button>

        {/* Subtle Vertical Divider */}
        <div className="h-6 w-[1px] bg-[#4D8DBA]/40 mx-0.5 sm:mx-1" />

        {/* 3. Search Icon Button */}
        <button
          type="button"
          onClick={onToggleSearchInChat}
          className={cn(
            "p-2 sm:p-2.5 rounded-xl transition cursor-pointer",
            isSearchOpen
              ? "bg-[#4D8DBA]/40 text-[#97D7FF]"
              : "text-slate-200 hover:text-white hover:bg-[#4D8DBA]/25"
          )}
          title="Search messages"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* 4. More Options Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((p) => !p)}
            className="p-2 sm:p-2.5 rounded-xl hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer text-slate-200"
            title="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-11 w-48 bg-[#086288] border border-[#4D8DBA] rounded-2xl shadow-2xl p-1.5 z-50 text-xs backdrop-blur-2xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenContactInfo?.();
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-[#4D8DBA]/30 text-left flex items-center gap-2 text-slate-100 transition cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-[#97D7FF]" />
                    <span>Contact info</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMuted((prev) => !prev);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-[#4D8DBA]/30 text-left flex items-center gap-2 text-slate-100 transition cursor-pointer"
                  >
                    <BellOff className="w-4 h-4 text-[#FFEFC4]" />
                    <span>{isMuted ? "Unmute notifications" : "Mute notifications"}</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-[#4D8DBA]/30">
                    <button
                      type="button"
                      onClick={() => setShowMenu(false)}
                      className="w-full px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-300 text-left flex items-center gap-2 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear messages</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
