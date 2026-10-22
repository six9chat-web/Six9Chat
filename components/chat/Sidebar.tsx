"use client";

import React, { useState } from "react";
import {
  Search,
  MessageSquarePlus,
  X,
  MessageSquare,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ChatList } from "@/components/chat/ChatList";
import { ChatContact, StoryItem, UserProfile, ChatRequest } from "@/types/chat";
import { ChatFilterType } from "@/hooks/useRealtimeChat";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "@/components/chat/NotificationBell";
import { NewChatPanel } from "@/components/chat/NewChatPanel";
import { useTranslation } from "@/lib/LanguageContext";
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
  onOpenNewChat?: () => void;
  onOpenNewGroup?: () => void;
  onOpenCommunity?: () => void;
  onAddNewContact?: (
    name: string,
    phoneOrUid: string,
    avatarUrl?: string,
    targetUserId?: string
  ) => void;
  supabaseStatus: "checking" | "connected" | "pending" | "error";
  channelConnected: boolean;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  chatRequests?: ChatRequest[];
  onAcceptChatRequest?: (req: ChatRequest) => Promise<void> | void;
  onRejectChatRequest?: (id: string) => Promise<void> | void;
  onSendChatRequest?: (targetUserId: string) => Promise<void> | void;
  onDeleteContact?: (contactId: string) => void;
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
  onOpenNewGroup,
  onAddNewContact,
  onOpenProfile,
  chatRequests = [],
  onAcceptChatRequest,
  onRejectChatRequest,
  onSendChatRequest,
  onDeleteContact,
}: SidebarProps) {
  const { t } = useTranslation();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const userRecord = currentUser as unknown as Record<string, unknown>;
  const currentUsername =
    (typeof userRecord?.username === "string" && userRecord.username ? userRecord.username : null) ||
    (currentUser?.username ? currentUser.username : null) ||
    (currentUser?.name && currentUser.name !== "You" ? currentUser.name : null) ||
    (currentUser?.email ? currentUser.email.split("@")[0] : null) ||
    "User";

  const filterTabs: { id: ChatFilterType; label: string }[] = [
    { id: "all", label: t("all", "All") },
    { id: "unread", label: t("unread", "Unread") },
    { id: "pinned", label: t("pinned", "Pinned") },
    { id: "groups", label: t("groups", "Groups") },
  ];

  // Pure local filter — strictly excludes current logged-in user
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSelfContact = (c: any) => {
    if (!currentUser) return false;
    if (currentUser.id && c.id === currentUser.id) return true;
    if (currentUser.name && c.name === currentUser.name && currentUser.name !== "You") return true;
    if (currentUser.username && (c.name?.toLowerCase().replace(/^@+/, "") === currentUser.username.toLowerCase().replace(/^@+/, ""))) return true;
    return false;
  };

  const filteredContacts = trimmedQuery
    ? contacts.filter(
        (c) =>
          !isSelfContact(c) &&
          (c.name.toLowerCase().includes(trimmedQuery) ||
          (c.phone && c.phone.toLowerCase().includes(trimmedQuery)))
      )
    : contacts.filter((c) => !isSelfContact(c));

  return (
    <aside className="w-full h-full min-h-0 flex flex-col bg-[#053b53] border-r border-[#4D8DBA]/30 z-20 shrink-0 select-none overflow-hidden relative">

      {/* 1. Header Bar: Profile Avatar + Username + Notification Bell + New Chat Button */}
      <div className="h-16 px-4 bg-[#086288] border-b border-[#4D8DBA]/35 backdrop-blur-xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* User Profile Avatar / Settings trigger */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-10 h-10 rounded-full hover:scale-105 transition cursor-pointer shrink-0 ring-2 ring-[#97D7FF]/40 overflow-hidden shadow-md flex items-center justify-center bg-gradient-to-tr from-[#086288] to-[#4D8DBA]"
            title={currentUser?.name ? `${currentUser.name} (Settings)` : t("profileSettings", "Profile & Settings")}
          >
            <Avatar
              src={currentUser?.avatar}
              alt={currentUser?.name || "Profile"}
              className="w-full h-full"
            />
          </button>
          <div
            onClick={onOpenProfile}
            className="flex flex-col min-w-0 cursor-pointer group justify-center"
            title={t("profileSettings", "Profile & Settings")}
          >
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight group-hover:text-[#97D7FF] transition truncate">
              {currentUser?.username || currentUsername}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-200">
          {/* Notification Bell with Realtime Pending Chat Requests */}
          <NotificationBell
            requests={chatRequests}
            onAccept={onAcceptChatRequest || (() => {})}
            onReject={onRejectChatRequest || (() => {})}
          />

          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => {
              setIsNewChatOpen(true);
              onOpenNewChat?.();
            }}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-[#4D8DBA] hover:bg-[#97D7FF] text-white hover:text-[#086288] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#086288]/40 transition active:scale-95 cursor-pointer"
            title={t("newChat", "New Chat")}
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Local Filter Search Bar — filters ONLY active conversations, no DB calls */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-300 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchNameOrUsername", "Search name or username...")}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
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

      {/* 4. Chat List — passes locally-filtered contacts; shows empty state on no match */}
      {trimmedQuery && filteredContacts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center select-none">
          <div className="w-12 h-12 rounded-2xl bg-[#032433] border border-[#4D8DBA]/40 flex items-center justify-center mb-3 shadow-lg">
            <MessageSquare className="w-5 h-5 text-[#4D8DBA]" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{t("noActiveChats", "No active chats yet")}</p>
          <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
            {t("noActiveChatsDesc", "Search a user by username to start messaging.")}
          </p>
        </div>
      ) : (
        <ChatList
          contacts={filteredContacts}
          activeContactId={activeContactId}
          onSelectContact={onSelectContact}
          onDeleteContact={onDeleteContact}
        />
      )}

      {/* WhatsApp-Style New Chat Left Panel View */}
      <AnimatePresence>
        {isNewChatOpen && (
          <NewChatPanel
            isOpen={isNewChatOpen}
            onClose={() => setIsNewChatOpen(false)}
            currentUser={currentUser}
            contacts={contacts}
            onSelectContact={onSelectContact}
            onAddNewContact={onAddNewContact}
            onOpenNewGroup={onOpenNewGroup}
            onSendChatRequest={onSendChatRequest}
            onDeleteContact={onDeleteContact}
          />
        )}
      </AnimatePresence>
    </aside>
  );
}
