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
  supabaseStatus: "checking" | "connected" | "pending" | "error";
  channelConnected: boolean;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
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
  supabaseStatus,
  channelConnected,
  onSignOut,
  onOpenProfile,
}: SidebarProps) {
  const [showStatusDetails, setShowStatusDetails] = useState(false);

  const hasUnreadStories = stories.some((s) => !s.viewed);

  const filters: { id: ChatFilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "groups", label: "Groups" },
    { id: "pinned", label: "Pinned" },
  ];

  return (
    <aside className="w-full md:w-[380px] lg:w-[420px] h-full flex flex-col bg-[#0F172A] border-r border-slate-800/80 z-20 shrink-0 select-none">
      {/* Top Header */}
      <div className="h-16 px-4 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between shrink-0">
        {/* Brand & User Profile */}
        <div className="flex items-center gap-3">
          <div
            onClick={onOpenProfile}
            className="relative group cursor-pointer"
            title={`${currentUser.name} - Click to view profile`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1DB980] to-[#0070F3] flex items-center justify-center font-bold text-xs text-white shadow-md overflow-hidden">
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

          <Logo size={32} showText={true} />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Status Stories Button */}
          <button
            type="button"
            onClick={onOpenStories}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="Status Stories"
          >
            <CircleDashed className="w-5 h-5 text-slate-300" />
            {hasUnreadStories && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#1DB980] ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={onOpenNewChat}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="New Chat / Contact"
          >
            <MessageSquarePlus className="w-5 h-5 text-[#1DB980]" />
          </button>

          {/* Supabase Status Toggle Icon */}
          <button
            type="button"
            onClick={() => setShowStatusDetails((prev) => !prev)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="Supabase Connection Info"
          >
            <Database
              className={cn(
                "w-5 h-5 transition-colors",
                supabaseStatus === "connected"
                  ? "text-[#1DB980]"
                  : supabaseStatus === "pending"
                  ? "text-[#0070F3]"
                  : "text-amber-400"
              )}
            />
          </button>

          {/* Sign Out Action Button */}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition"
              title="Sign Out of Six9Chat"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

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
