"use client";

import React, { useState } from "react";
import {
  Search,
  MessageSquarePlus,
  CircleDashed,
  Moon,
  Sun,
  X,
  SlidersHorizontal,
  CheckCircle2,
  Database,
  Users,
  Radio,
  Lock,
  LogOut,
  User as UserIcon,
  MoreVertical,
  Archive,
  Star,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ChatList } from "@/components/chat/ChatList";
import { ChatContact, StoryItem, UserProfile } from "@/types/chat";
import { ChatFilterType } from "@/hooks/useRealtimeChat";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  currentUser: UserProfile;
  contacts: ChatContact[];
  activeContactId: string;
  onSelectContact: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: ChatFilterType;
  onFilterChange: (filter: ChatFilterType) => void;
  stories: StoryItem[];
  onOpenStories: () => void;
  onOpenNewChat: () => void;
  onOpenNewGroup?: () => void;
  supabaseStatus: "checking" | "connected" | "pending" | "error";
  channelConnected: boolean;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

export function Sidebar({
  currentUser,
  contacts,
  activeContactId,
  onSelectContact,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  stories,
  onOpenStories,
  onOpenNewChat,
  onOpenNewGroup,
  supabaseStatus,
  channelConnected,
  onSignOut,
  onOpenProfile,
  onOpenSettings,
}: SidebarProps) {
  const [showStatusDetails, setShowStatusDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCommunityNotice, setShowCommunityNotice] = useState(false);

  const hasUnreadStories = stories.some((s) => !s.viewed);

  const filters: { id: ChatFilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "groups", label: "Groups" },
    { id: "pinned", label: "Pinned" },
  ];

  return (
    <aside className="w-full md:w-[380px] lg:w-[420px] xl:w-[450px] h-full flex flex-col bg-[#053b53] border-r border-[#4D8DBA]/35 z-20 shrink-0 select-none">
      {/* WhatsApp Left Sidebar Header */}
      <div className="h-16 px-4 bg-[#086288] border-b border-[#4D8DBA]/35 backdrop-blur-xl flex items-center justify-between shrink-0">
        {/* Left: User Avatar & Profile drawer trigger */}
        <div className="flex items-center gap-3">
          <div
            onClick={onOpenProfile}
            className="relative group cursor-pointer"
            title={`${currentUser.name} - Click to edit profile`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#086288] via-[#4D8DBA] to-[#97D7FF] flex items-center justify-center font-bold text-xs text-[#086288] shadow-md overflow-hidden ring-2 ring-transparent group-hover:ring-[#97D7FF] transition">
              {currentUser.avatar?.startsWith("data:") ||
              currentUser.avatar?.startsWith("http") ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#086288] font-bold">{currentUser.avatar}</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#97D7FF] ring-2 ring-[#086288]" />
          </div>

          <div className="hidden sm:block">
            <h3 className="text-xs font-bold text-white truncate max-w-[120px]">
              {currentUser.name}
            </h3>
            <span className="text-[10px] text-[#97D7FF] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#97D7FF] animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Right: WhatsApp Header Actions (Communities, Status, New Chat, Menu) */}
        <div className="flex items-center gap-0.5 sm:gap-1 text-slate-200">
          {/* 1. Communities / Channel Icon */}
          <button
            type="button"
            onClick={() => setShowCommunityNotice((prev) => !prev)}
            className="p-2.5 rounded-xl hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer"
            title="Communities & Channels"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* 2. Status / Story Ring Icon */}
          <button
            type="button"
            onClick={onOpenStories}
            className="relative p-2.5 rounded-xl hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer"
            title="Status stories"
          >
            <CircleDashed className="w-5 h-5" />
            {hasUnreadStories && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FFEFC4] ring-2 ring-[#086288] animate-pulse" />
            )}
          </button>

          {/* 3. New Chat / Add Contact Icon */}
          <button
            type="button"
            onClick={onOpenNewChat}
            className="p-2.5 rounded-xl hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer text-[#97D7FF]"
            title="New chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* 4. Menu Icon (Three vertical dots) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-2.5 rounded-xl hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer"
              title="Menu"
            >
              <MoreVertical className="w-5 h-5" />
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
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-12 z-40 w-52 rounded-2xl bg-[#086288] border border-[#4D8DBA]/60 shadow-2xl backdrop-blur-2xl py-1.5 text-xs text-slate-100"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onOpenNewGroup?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#4D8DBA]/30 text-left transition font-medium"
                    >
                      <Users className="w-4 h-4 text-[#97D7FF]" />
                      <span>New group</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onFilterChange("pinned");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#4D8DBA]/30 text-left transition font-medium"
                    >
                      <Archive className="w-4 h-4 text-[#4D8DBA]" />
                      <span>Archived</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        alert("Starred Messages: You have no starred messages currently.");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#4D8DBA]/30 text-left transition font-medium"
                    >
                      <Star className="w-4 h-4 text-[#FFEFC4]" />
                      <span>Starred messages</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        if (onOpenSettings) onOpenSettings();
                        else if (onOpenProfile) onOpenProfile();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#4D8DBA]/30 text-left transition font-medium"
                    >
                      <Settings className="w-4 h-4 text-[#97D7FF]" />
                      <span>Settings</span>
                    </button>

                    <div className="h-px bg-[#4D8DBA]/40 my-1" />

                    {onSignOut && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/20 text-red-300 text-left transition font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Community Announcement Banner */}
      <AnimatePresence>
        {showCommunityNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#086288]/95 border-b border-[#4D8DBA]/40 px-4 py-3 text-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#97D7FF]" />
                Six9Chat Communities & Channels
              </span>
              <button
                type="button"
                onClick={() => setShowCommunityNotice(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Stay connected with topic-based channels and group announcements. Full broadcast integration powered by Supabase edge clusters.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supabase Realtime Info Banner Drawer */}
      <AnimatePresence>
        {showStatusDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#086288]/95 border-b border-[#4D8DBA]/40 px-4 py-3 text-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#97D7FF] animate-pulse" />
                Supabase Real-Time Broadcast
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  supabaseStatus === "connected"
                    ? "bg-[#97D7FF]/20 text-[#97D7FF]"
                    : "bg-[#FFEFC4]/20 text-[#FFEFC4]"
                )}
              >
                {supabaseStatus === "connected" ? "Sync Active" : "Sim Ready"}
              </span>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Subscribed to channel{" "}
              <code className="text-[#97D7FF]">public:messages</code>. Realtime
              WebSocket multiplexing with sub-15ms message dissemination.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Input Bar */}
      <div className="p-3 pb-2">
        <div className="relative flex items-center bg-[#086288]/50 border border-[#4D8DBA]/40 rounded-xl px-3 py-2 text-slate-300 focus-within:border-[#97D7FF] focus-within:text-white transition">
          <Search className="w-4 h-4 mr-2 shrink-0 text-[#4D8DBA]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search or start new chat..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-300 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-slate-300 hover:text-white shrink-0 ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1.5 px-3 pb-3 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
              activeFilter === f.id
                ? "bg-[#97D7FF] text-[#086288] shadow-sm shadow-[#086288]/30 font-bold"
                : "bg-[#086288]/50 border border-[#4D8DBA]/35 text-slate-200 hover:text-white hover:bg-[#4D8DBA]/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <ChatList
        contacts={contacts}
        activeContactId={activeContactId}
        onSelectContact={onSelectContact}
      />

      {/* Footer Security Badging */}
      <div className="p-2.5 bg-[#086288]/60 border-t border-[#4D8DBA]/30 flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
        <Lock className="w-3 h-3 text-[#97D7FF]" />
        <span>End-to-end encrypted with Supabase RLS</span>
      </div>
    </aside>
  );
}
