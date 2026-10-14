"use client";

import React, { useState } from "react";
import {
  Search,
  MessageSquarePlus,
  MoreVertical,
  X,
  Plus,
  Users,
  CircleDashed,
  Settings,
  Archive,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";
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
  onOpenCommunity?: () => void;
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
  onOpenCommunity,
  supabaseStatus,
  channelConnected,
  onSignOut,
  onOpenProfile,
  onOpenSettings,
}: SidebarProps) {
  const [showMenu, setShowMenu] = useState(false);

  const filterTabs: { id: ChatFilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "favourites", label: "Favourites" },
    { id: "groups", label: "Groups" },
    { id: "communities", label: "Communities" },
  ];

  return (
    <aside className="w-full md:w-[380px] lg:w-[420px] xl:w-[440px] h-full min-h-0 flex flex-col bg-[#053b53] border-r border-[#4D8DBA]/30 z-20 shrink-0 select-none overflow-hidden">
      {/* 1. Header Bar: "Chats" title + WhatsApp Header Action Buttons */}
      <div className="h-16 px-4 bg-[#086288] border-b border-[#4D8DBA]/35 backdrop-blur-xl flex items-center justify-between shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Chats
        </h1>

        <div className="flex items-center gap-1 text-slate-200 relative">
          {/* Menu Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer"
            title="Menu"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* New Chat Pill Button (Matching WhatsApp Web green/accent icon pill) */}
          <button
            type="button"
            onClick={onOpenNewChat}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-[#4D8DBA] hover:bg-[#97D7FF] text-white hover:text-[#086288] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#086288]/40 transition active:scale-95 cursor-pointer"
            title="New Chat (+)"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* Context Dropdown Menu */}
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
                  className="absolute right-0 top-12 w-52 bg-[#086288] border border-[#4D8DBA] rounded-2xl shadow-2xl p-1.5 z-50 text-xs backdrop-blur-2xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenNewGroup?.();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-[#4D8DBA]/30 text-left flex items-center gap-2.5 text-slate-100 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-[#97D7FF]" />
                    <span>New Group</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenCommunity?.();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-[#4D8DBA]/30 text-left flex items-center gap-2.5 text-slate-100 transition cursor-pointer"
                  >
                    <CircleDashed className="w-4 h-4 text-[#FFEFC4]" />
                    <span>New Community</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenProfile?.();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-[#4D8DBA]/30 text-left flex items-center gap-2.5 text-slate-100 transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-300" />
                    <span>Settings & Profile</span>
                  </button>

                  {onSignOut && (
                    <div className="pt-1 mt-1 border-t border-[#4D8DBA]/30">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onSignOut();
                        }}
                        className="w-full px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-300 text-left flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Rounded Search Bar ("Search or start a new chat") */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-300 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search or start a new chat"
            className="w-full h-10 pl-10 pr-9 rounded-full bg-[#032433] border border-[#4D8DBA]/40 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Filter Pill Tabs: All, Unread, Favourites, Groups, Communities, (+) */}
      <div className="px-3 pb-2.5 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0",
                isActive
                  ? "bg-[#4D8DBA] text-white shadow-md shadow-[#086288]/40 ring-1 ring-[#97D7FF]/50"
                  : "bg-[#032433] border border-[#4D8DBA]/35 text-slate-300 hover:text-white hover:bg-[#4D8DBA]/25"
              )}
            >
              {tab.label}
            </button>
          );
        })}

        {/* (+) Add Pill Tab */}
        <button
          type="button"
          onClick={onOpenNewChat}
          title="Add chat or list"
          className="w-7 h-7 rounded-full bg-[#032433] border border-[#4D8DBA]/35 text-slate-300 hover:text-white hover:bg-[#4D8DBA]/25 flex items-center justify-center text-xs font-bold shrink-0 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Chat List Section */}
      <ChatList
        contacts={contacts}
        activeContactId={activeContactId}
        onSelectContact={onSelectContact}
      />
    </aside>
  );
}
