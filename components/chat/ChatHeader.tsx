"use client";

import React from "react";
import {
  Phone,
  Video,
  Search,
  ArrowLeft,
  X,
} from "lucide-react";
import { ChatContact } from "@/types/chat";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslation } from "@/lib/LanguageContext";
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
  const { t } = useTranslation();
  return (
    <header className="h-16 px-3 sm:px-5 bg-[#086288] border-b border-[#4D8DBA]/35 backdrop-blur-xl flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Contact Info (Back button on mobile + DP + Name + "click here for contact info") */}
      <div
        onClick={onOpenContactInfo}
        className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer group"
      >
        {onBackToSidebar && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBackToSidebar();
            }}
            className="md:hidden p-2 -ml-1 rounded-full text-slate-200 hover:text-white hover:bg-[#4D8DBA]/30 transition active:scale-95 cursor-pointer shrink-0"
            aria-label="Back to contacts list"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Circular DP */}
        <div className="relative shrink-0">
          <Avatar
            src={contact.avatar}
            alt={contact.name}
            className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 shadow-md transition-transform group-hover:scale-105",
              contact.avatarColor || "from-[#086288] to-[#4D8DBA]"
            )}
          />
          {contact.status === "online" && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#97D7FF] ring-2 ring-[#086288]" />
          )}
        </div>

        {/* Name + "click here for contact info" */}
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-[#FFEFC4] transition-colors max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-sm">
            {contact.name}
          </h2>

          <p className="text-[11px] sm:text-xs text-slate-300 group-hover:text-[#97D7FF] truncate transition-colors leading-tight">
            {isTyping ? (
              <span className="text-[#97D7FF] font-medium animate-pulse">
                {t("typing", "typing...")}
              </span>
            ) : (
              t("clickForContactInfo", "click here for contact info")
            )}
          </p>
        </div>
      </div>

      {/* Right Action Buttons: Video call icon, Voice call icon, Search icon (3-dots removed) */}
      <div className="flex items-center gap-1 sm:gap-2 text-slate-200">
        {/* In-chat Search Input (Expandable) */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "160px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative hidden sm:flex items-center overflow-hidden"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={t("searchInChat", "Search in chat...")}
                className="w-full h-8 pl-3 pr-7 rounded-full bg-[#053b53] border border-[#4D8DBA]/50 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF]"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.("")}
                  className="absolute right-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Video Call Button */}
        <button
          type="button"
          onClick={onVideoCall}
          className="p-1.5 sm:p-2.5 rounded-xl hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer text-slate-200 active:scale-95"
          title={t("videoCall", "Video call")}
        >
          <Video className="w-5 h-5" />
        </button>

        {/* 2. Voice Call Button */}
        <button
          type="button"
          onClick={onVoiceCall}
          className="p-1.5 sm:p-2.5 rounded-xl hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer text-slate-200 active:scale-95"
          title={t("voiceCall", "Voice call")}
        >
          <Phone className="w-5 h-5" />
        </button>

        {/* Subtle Vertical Divider */}
        <div className="h-5 sm:h-6 w-[1px] bg-[#4D8DBA]/40 mx-0.5 sm:mx-1" />

        {/* 3. Search Icon Button */}
        <button
          type="button"
          onClick={onToggleSearchInChat}
          className={cn(
            "p-1.5 sm:p-2.5 rounded-xl transition cursor-pointer active:scale-95",
            isSearchOpen
              ? "bg-[#4D8DBA]/40 text-[#97D7FF]"
              : "text-slate-200 hover:text-white hover:bg-[#4D8DBA]/25"
          )}
          title={t("searchInChat", "Search in chat")}
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
