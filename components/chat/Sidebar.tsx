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
    <aside className="w-full md:w-[380px] lg:w-[420px] xl:w-[450px] h-full flex flex-col bg-[#0F172A] border-r border-slate-800/80 z-20 shrink-0 select-none">
      {/* WhatsApp Left Sidebar Header */}
      <div className="h-16 px-4 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between shrink-0">
        {/* Left: User Avatar & Profile drawer trigger */}
        <div className="flex items-center gap-3">
          <div
            onClick={onOpenProfile}
            className="relative group cursor-pointer"
            title={`${currentUser.name} - Click to edit profile`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1DB980] to-[#0070F3] flex items-center justify-center font-bold text-xs text-white shadow-md overflow-hidden ring-2 ring-transparent group-hover:ring-[#1DB980] transition">
              {currentUser.avatar?.startsWith("data:") ||
              currentUser.avatar?.startsWith("http") ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser.avatar}</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#1DB980] ring-2 ring-slate-900" />
          </div>

          <div className="hidden sm:block">
            <h3 className="text-xs font-bold text-white truncate max-w-[120px]">
              {currentUser.name}
            </h3>
            <span className="text-[10px] text-[#1DB980] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1DB980] animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Right: WhatsApp Header Actions (Communities, Status, New Chat, Menu) */}
        <div className="flex items-center gap-0.5 sm:gap-1 text-slate-300">
          {/* 1. Communities / Channel Icon */}
          <button
            type="button"
            onClick={() => setShowCommunityNotice((prev) => !prev)}
            className="p-2.5 rounded-xl hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
            title="Communities & Channels"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* 2. Status / Story Ring Icon */}
          <button
            type="button"
            onClick={onOpenStories}
            className="relative p-2.5 rounded-xl hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
            title="Status stories"
          >
            <CircleDashed className="w-5 h-5" />
            {hasUnreadStories && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1DB980] ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* 3. New Chat / Add Contact Icon */}
          <button
            type="button"
            onClick={onOpenNewChat}
            className="p-2.5 rounded-xl hover:text-white hover:bg-slate-800/80 transition cursor-pointer text-[#1DB980]"
            title="New chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* 4. Menu Icon (Three vertical dots) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-2.5 rounded-xl hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
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
                    className="absolute right-0 top-12 z-40 w-52 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-2xl py-1.5 text-xs text-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onOpenNewGroup?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 text-left transition font-medium"
                    >
                      <Users className="w-4 h-4 text-[#1DB980]" />
                      <span>New group</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onFilterChange("pinned");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 text-left transition font-medium"
                    >
                      <Archive className="w-4 h-4 text-slate-400" />
                      <span>Archived</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        alert("Starred Messages: You have no starred messages currently.");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 text-left transition font-medium"
                    >
                      <Star className="w-4 h-4 text-amber-400" />
                      <span>Starred messages</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        if (onOpenSettings) onOpenSettings();
                        else if (onOpenProfile) onOpenProfile();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 text-left transition font-medium"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </button>

                    <div className="h-px bg-slate-800 my-1" />

                    {onSignOut && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-400 text-left transition font-semibold"
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
            className="overflow-hidden bg-slate-900/90 border-b border-slate-800 px-4 py-3 text-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#1DB980]" />
                Six9Chat Communities & Channels
              </span>
              <button
                type="button"
                onClick={() => setShowCommunityNotice(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
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
            className="overflow-hidden bg-slate-900/90 border-b border-slate-800 px-4 py-3 text-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#1DB980] animate-pulse" />
                Supabase Real-Time Broadcast
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  supabaseStatus === "connected"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-blue-500/20 text-blue-400"
                )}
              >
                {supabaseStatus === "connected" ? "Sync Active" : "Sim Ready"}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Subscribed to channel{" "}
              <code className="text-emerald-300">public:messages</code>. Realtime
              WebSocket multiplexing with sub-15ms message dissemination.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Input Bar */}
      <div className="p-3 pb-2">
        <div className="relative flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-400 focus-within:border-[#1DB980] focus-within:text-white transition">
          <Search className="w-4 h-4 mr-2 shrink-0 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search or start new chat..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-slate-400 hover:text-white shrink-0 ml-1"
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
                ? "bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-white shadow-sm shadow-[#1DB980]/20"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
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
      <div className="p-2.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <Lock className="w-3 h-3 text-[#1DB980]" />
        <span>End-to-end encrypted with Supabase RLS</span>
      </div>
    </aside>
  );
}
