"use client";

import React from "react";
import {
  MessageSquare,
  CircleDashed,
  Radio,
  Users,
  Sparkles,
  Archive,
  Settings,
} from "lucide-react";
import { UserProfile } from "@/types/chat";
import { cn } from "@/lib/utils";

interface NavigationRailProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: UserProfile;
  hasUnreadStories?: boolean;
  onOpenStories?: () => void;
  onOpenChannels?: () => void;
  onOpenCommunities?: () => void;
  onOpenAi?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenArchived?: () => void;
}

export function NavigationRail({
  activeTab,
  onTabChange,
  currentUser,
  hasUnreadStories = false,
  onOpenStories,
  onOpenChannels,
  onOpenCommunities,
  onOpenAi,
  onOpenSettings,
  onOpenProfile,
  onOpenArchived,
}: NavigationRailProps) {
  return (
    <nav
      aria-label="WhatsApp Web Navigation Rail"
      className="w-14 sm:w-16 h-full min-h-0 bg-[#032433] border-r border-[#4D8DBA]/25 flex flex-col items-center justify-between py-3 shrink-0 select-none z-30 overflow-hidden"
    >
      {/* Top Main Navigation Items */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        {/* 1. Chats Tab */}
        <button
          type="button"
          onClick={() => onTabChange("chats")}
          title="Chats"
          className={cn(
            "relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
            activeTab === "chats"
              ? "bg-[#4D8DBA]/35 text-[#97D7FF] ring-1 ring-[#97D7FF]/40 shadow-md shadow-[#086288]/40"
              : "text-slate-300 hover:text-white hover:bg-[#4D8DBA]/20"
          )}
        >
          <MessageSquare className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          {activeTab === "chats" && (
            <span className="absolute -left-2 w-1 h-5 rounded-r-full bg-[#97D7FF]" />
          )}
        </button>

        {/* 2. Status / Stories Tab */}
        <button
          type="button"
          onClick={() => {
            onTabChange("status");
            onOpenStories?.();
          }}
          title="Status Stories"
          className={cn(
            "relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
            activeTab === "status"
              ? "bg-[#4D8DBA]/35 text-[#97D7FF] ring-1 ring-[#97D7FF]/40 shadow-md"
              : "text-slate-300 hover:text-white hover:bg-[#4D8DBA]/20"
          )}
        >
          <CircleDashed className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          {hasUnreadStories && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#97D7FF] ring-2 ring-[#032433] animate-pulse" />
          )}
        </button>

        {/* 3. Channels Tab */}
        <button
          type="button"
          onClick={() => {
            onTabChange("channels");
            onOpenChannels?.();
          }}
          title="Channels"
          className={cn(
            "relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
            activeTab === "channels"
              ? "bg-[#4D8DBA]/35 text-[#97D7FF] ring-1 ring-[#97D7FF]/40 shadow-md"
              : "text-slate-300 hover:text-white hover:bg-[#4D8DBA]/20"
          )}
        >
          <Radio className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </button>

        {/* 4. Communities Tab */}
        <button
          type="button"
          onClick={() => {
            onTabChange("communities");
            onOpenCommunities?.();
          }}
          title="Communities"
          className={cn(
            "relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
            activeTab === "communities"
              ? "bg-[#4D8DBA]/35 text-[#97D7FF] ring-1 ring-[#97D7FF]/40 shadow-md"
              : "text-slate-300 hover:text-white hover:bg-[#4D8DBA]/20"
          )}
        >
          <Users className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </button>

        {/* 5. Meta AI / Six9 AI Sparkle Button */}
        <button
          type="button"
          onClick={() => {
            onTabChange("ai");
            onOpenAi?.();
          }}
          title="Six9 Meta AI Assistant"
          className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#086288] via-[#4D8DBA] to-[#97D7FF] hover:scale-105 transition-transform duration-200 shadow-md shadow-[#086288]/40 group cursor-pointer mt-1"
        >
          <div className="w-full h-full rounded-full bg-[#032433] flex items-center justify-center group-hover:bg-[#032433]/80 transition">
            <Sparkles className="w-4.5 h-4.5 text-[#97D7FF] group-hover:text-[#FFEFC4] transition" />
          </div>
        </button>
      </div>

      {/* Bottom Auxiliary Actions & User Avatar */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        {/* Archived Chats */}
        <button
          type="button"
          onClick={() => {
            onTabChange("archived");
            onOpenArchived?.();
          }}
          title="Archived"
          className={cn(
            "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
            activeTab === "archived"
              ? "bg-[#4D8DBA]/35 text-[#97D7FF] ring-1 ring-[#97D7FF]/40"
              : "text-slate-300 hover:text-white hover:bg-[#4D8DBA]/20"
          )}
        >
          <Archive className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={() => {
            onTabChange("settings");
            onOpenSettings?.();
          }}
          title="Settings"
          className={cn(
            "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
            activeTab === "settings"
              ? "bg-[#4D8DBA]/35 text-[#97D7FF] ring-1 ring-[#97D7FF]/40"
              : "text-slate-300 hover:text-white hover:bg-[#4D8DBA]/20"
          )}
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Profile Avatar */}
        <div
          onClick={onOpenProfile}
          title={`${currentUser.name} - Profile & Account`}
          className="relative mt-1 cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#086288] via-[#4D8DBA] to-[#97D7FF] flex items-center justify-center font-bold text-xs text-[#086288] overflow-hidden ring-2 ring-[#4D8DBA]/50 group-hover:ring-[#97D7FF] transition shadow-md">
            {currentUser.avatar?.startsWith("data:") ||
            currentUser.avatar?.startsWith("http") ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#086288] font-bold text-xs">
                {currentUser.avatar || "ME"}
              </span>
            )}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#97D7FF] ring-2 ring-[#032433]" />
        </div>
      </div>
    </nav>
  );
}
