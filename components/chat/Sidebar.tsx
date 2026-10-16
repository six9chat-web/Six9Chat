"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  MessageSquarePlus,
  X,
  AlertCircle,
  Loader2,
  UserX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatList } from "@/components/chat/ChatList";
import { ChatContact, StoryItem, UserProfile, ChatRequest } from "@/types/chat";
import { ChatFilterType } from "@/hooks/useRealtimeChat";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "@/components/chat/NotificationBell";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

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
  onAddNewContact?: (name: string, phoneOrUid: string) => void;
  supabaseStatus: "checking" | "connected" | "pending" | "error";
  channelConnected: boolean;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  chatRequests?: ChatRequest[];
  onAcceptChatRequest?: (req: ChatRequest) => Promise<void> | void;
  onRejectChatRequest?: (id: string) => Promise<void> | void;
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
  onOpenNewChat,
  onAddNewContact,
  onOpenProfile,
  chatRequests = [],
  onAcceptChatRequest,
  onRejectChatRequest,
}: SidebarProps) {
  const userRecord = currentUser as unknown as Record<string, unknown>;
  const currentUsername =
    (typeof userRecord?.username === "string" && userRecord.username ? userRecord.username : null) ||
    (currentUser?.name && currentUser.name !== "You" ? currentUser.name : null) ||
    (currentUser?.email ? currentUser.email.split("@")[0] : null) ||
    "user";

  const filterTabs: { id: ChatFilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "pinned", label: "Pinned" },
    { id: "groups", label: "Groups" },
  ];

  // Search validation states
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "found" | "not_found">("idle");
  const [matchedProfile, setMatchedProfile] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  } | null>(null);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerPopup = (msg: string) => {
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    setPopupMessage(msg);
    popupTimerRef.current = setTimeout(() => {
      setPopupMessage(null);
    }, 4000);
  };

  // Debounced search validation strictly against Supabase profiles table
  useEffect(() => {
    let isCancelled = false;
    const clean = searchQuery.trim().replace(/^@+/, "").toLowerCase();

    if (!clean) {
      setSearchStatus("idle");
      setMatchedProfile(null);
      return;
    }

    setSearchStatus("searching");

    const timer = setTimeout(async () => {
      try {
        // 1. Strict real-time search via server API querying Supabase profiles table
        const res = await fetch(`/api/user/search?q=${encodeURIComponent(clean)}`).catch(() => null);
        let foundUsers: Array<{
          id: string;
          username: string;
          fullName: string;
          avatarUrl?: string;
        }> = [];

        if (res && res.ok) {
          const json = await res.json().catch(() => ({}));
          if (Array.isArray(json.users)) {
            foundUsers = json.users;
          }
        }

        // 2. Direct Supabase browser client query backup (case-insensitive ilike)
        if (foundUsers.length === 0) {
          const { data } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, status")
            .or(`username.ilike.%${clean}%,full_name.ilike.%${clean}%`)
            .limit(10);

          if (Array.isArray(data) && data.length > 0) {
            foundUsers = data.map((d: any) => ({
              id: d.id,
              username: d.username,
              fullName: d.full_name || d.username,
              avatarUrl: d.avatar_url || "",
            }));
          }
        }

        // 3. Fallback: Directory API (all registered Supabase accounts)
        if (foundUsers.length === 0) {
          const dirRes = await fetch("/api/user/directory").catch(() => null);
          if (dirRes && dirRes.ok) {
            const dirJson = await dirRes.json().catch(() => ({}));
            if (Array.isArray(dirJson.users)) {
              const matched = dirJson.users.filter((u: any) =>
                u.username?.toLowerCase().includes(clean) ||
                u.fullName?.toLowerCase().includes(clean)
              );
              if (matched.length > 0) {
                foundUsers = matched;
              }
            }
          }
        }

        // Abort updating state if user typed new characters or cleared the input
        if (isCancelled) return;

        // 4. Strict match evaluation: Only set found if user exists in database
        if (foundUsers.length > 0) {
          setMatchedProfile(foundUsers[0]);
          setSearchStatus("found");
        } else {
          setMatchedProfile(null);
          setSearchStatus("not_found");
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("[Sidebar search error]:", err);
          setMatchedProfile(null);
          setSearchStatus("not_found");
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleStartChatWithFoundUser = () => {
    if (!matchedProfile || !onAddNewContact) return;
    onAddNewContact(matchedProfile.fullName || matchedProfile.username, matchedProfile.username);
    onSearchChange("");
    setSearchStatus("idle");
    setMatchedProfile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const clean = searchQuery.trim().replace(/^@/, "").toLowerCase();
      if (!clean) return;

      if (searchStatus === "found" && matchedProfile) {
        handleStartChatWithFoundUser();
      } else if (searchStatus === "not_found") {
        triggerPopup("User not found");
      }
    }
  };

  return (
    <aside className="w-full h-full min-h-0 flex flex-col bg-[#053b53] border-r border-[#4D8DBA]/30 z-20 shrink-0 select-none overflow-hidden relative">
      {/* Immediate Popup Toast if user does not exist */}
      <AnimatePresence>
        {popupMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            className="absolute top-16 left-3 right-3 z-50 p-2.5 rounded-xl bg-red-600/95 border border-red-400 text-white shadow-2xl flex items-center justify-between text-xs backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
              <span className="font-bold tracking-tight">{popupMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setPopupMessage(null)}
              className="p-1 rounded-lg text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Bar: Profile Avatar + Username + Notification Bell + New Chat Button */}
      <div className="h-16 px-4 bg-[#086288] border-b border-[#4D8DBA]/35 backdrop-blur-xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* User Profile Avatar / Settings trigger */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-10 h-10 rounded-full hover:scale-105 transition cursor-pointer shrink-0 ring-2 ring-[#97D7FF]/40 overflow-hidden shadow-md flex items-center justify-center bg-gradient-to-tr from-[#086288] to-[#4D8DBA]"
            title={currentUser?.name ? `${currentUser.name} (Settings)` : "Profile & Settings"}
          >
            <Avatar
              src={currentUser?.avatar}
              alt={currentUser?.name || "Profile"}
              className="w-full h-full"
            />
          </button>
          <div
            onClick={onOpenProfile}
            className="flex flex-col min-w-0 cursor-pointer group"
            title="View Profile & Settings"
          >
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight group-hover:text-[#97D7FF] transition truncate">
              {currentUser?.name || currentUsername}
            </h1>
            <span className="text-[11px] font-mono font-medium text-[#97D7FF] leading-tight truncate">
              @{currentUsername.toLowerCase().replace(/^@/, "")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-200">
          {/* Notification Bell (🔔) with Realtime Pending Chat Requests */}
          <NotificationBell
            requests={chatRequests}
            onAccept={onAcceptChatRequest || (() => {})}
            onReject={onRejectChatRequest || (() => {})}
          />

          {/* New Chat Pill Button */}
          <button
            type="button"
            onClick={onOpenNewChat}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-[#4D8DBA] hover:bg-[#97D7FF] text-white hover:text-[#086288] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#086288]/40 transition active:scale-95 cursor-pointer"
            title="New Chat (+)"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Rounded Search Bar ("Add User by Username (e.g. alexrivers)...") */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-300 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add User by Username (e.g. alexrivers)..."
            className="w-full h-10 pl-10 pr-9 rounded-full bg-[#032433] border border-[#4D8DBA]/40 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                setSearchStatus("idle");
                setMatchedProfile(null);
                setPopupMessage(null);
              }}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Searching Validation Indicator */}
        {searchStatus === "searching" && searchQuery.trim().replace(/^@+/, "").length > 0 && (
          <div className="mt-2 p-2 rounded-xl bg-[#086288]/50 border border-[#4D8DBA]/30 flex items-center gap-2 text-xs text-slate-300">
            <Loader2 className="w-3.5 h-3.5 text-[#97D7FF] animate-spin shrink-0" />
            <span className="text-[11px] text-slate-300 font-medium">Checking username in Supabase...</span>
          </div>
        )}

        {/* Valid User Found Card */}
        {searchStatus === "found" && matchedProfile && searchQuery.trim().replace(/^@+/, "").length > 0 && (
          <div className="mt-2 p-2 rounded-xl bg-[#086288] border border-[#4D8DBA]/60 flex items-center justify-between text-xs text-white shadow-md animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Avatar
                src={matchedProfile.avatarUrl}
                alt={matchedProfile.fullName}
                className="w-8 h-8 shrink-0 ring-1 ring-[#97D7FF]/40"
              />
              <div className="min-w-0">
                <p className="font-bold text-white text-xs truncate leading-tight">
                  {matchedProfile.fullName}
                </p>
                <p className="truncate font-mono font-medium text-[#97D7FF] text-[10px] leading-tight">
                  @{matchedProfile.username.replace(/^@+/, "")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartChatWithFoundUser}
              className="px-2.5 py-1.5 rounded-lg bg-[#97D7FF] hover:bg-[#b4e3ff] text-[#086288] font-black text-[11px] transition cursor-pointer shrink-0"
            >
              + Chat Now
            </button>
          </div>
        )}

        {/* Invalid User Search Validation: Clean "User not found" state ONLY when query has active characters */}
        {searchStatus === "not_found" && searchQuery.trim().replace(/^@+/, "").length > 0 && (
          <div className="mt-2 p-2.5 rounded-xl bg-[#032433] border border-red-500/40 flex items-center justify-between text-xs text-red-200 shadow-md animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <UserX className="w-4 h-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-red-100 text-xs tracking-tight">User not found</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  No registered user matches &quot;@{searchQuery.trim().replace(/^@+/, "").toLowerCase()}&quot;
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Filter Pill Tabs: All, Unread, Pinned, Groups */}
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
