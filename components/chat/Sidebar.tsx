"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  MessageSquarePlus,
  X,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { ChatList } from "@/components/chat/ChatList";
import { SearchPanel } from "@/components/chat/SearchPanel";
import { ChatContact, StoryItem, UserProfile, ChatRequest } from "@/types/chat";
import { ChatFilterType } from "@/hooks/useRealtimeChat";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationBell } from "@/components/chat/NotificationBell";
import { useTranslation } from "@/lib/LanguageContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentUser: UserProfile;
  contacts: ChatContact[];
  isLoadingContacts?: boolean;
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
  onBlockUser?: (contactId: string) => void;
  onUnblockUser?: (contactId: string) => void;
  onClearChat?: (contactId: string) => void;
  onDeleteChat?: (contactId: string) => void;
  onUnfriend?: (contactId: string) => void;
}

export function Sidebar({
  currentUser,
  contacts,
  isLoadingContacts = false,
  activeContactId,
  onSelectContact,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenProfile,
  chatRequests = [],
  onAcceptChatRequest,
  onRejectChatRequest,
  onSendChatRequest,
  onDeleteContact,
  onBlockUser,
  onUnblockUser,
  onClearChat,
  onDeleteChat,
  onUnfriend,
}: SidebarProps) {
  const { t } = useTranslation();
  const [isSearchMode, setIsSearchMode] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Pure local filter for Active Conversations Mode — strictly excludes current logged-in user
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSelfContact = useCallback((c: ChatContact) => {
    if (!currentUser?.id || !c?.id) return false;
    return c.id === currentUser.id;
  }, [currentUser?.id]);

  const filteredContacts = React.useMemo(() => {
    return contacts.filter((c) => {
      if (isSelfContact(c)) return false;

      const matchesQuery = !trimmedQuery ||
        c.name.toLowerCase().includes(trimmedQuery) ||
        (c.phone && c.phone.toLowerCase().includes(trimmedQuery)) ||
        (c.lastMessage && c.lastMessage.text.toLowerCase().includes(trimmedQuery));

      if (!matchesQuery) return false;

      if (activeFilter === "unread") return (c.unreadCount || 0) > 0;
      if (activeFilter === "pinned") return Boolean(c.isPinned || c.isFavourite);
      if (activeFilter === "groups") return Boolean(c.isGroup);

      return true;
    });
  }, [contacts, trimmedQuery, isSelfContact, activeFilter]);

  // Handler to close search mode and instantly restore Active Conversations list
  const handleCloseSearch = useCallback(() => {
    setIsSearchMode(false);
    onSearchChange("");
    searchInputRef.current?.blur();
  }, [onSearchChange]);

  // Click-Outside Listener: Clicking anywhere outside the search container auto-dismisses search mode
  useClickOutside(
    searchContainerRef,
    () => {
      if (isSearchMode || Boolean(searchQuery.trim())) {
        handleCloseSearch();
      }
    },
    isSearchMode || Boolean(searchQuery.trim())
  );

  // Keyboard shortcut: Pressing 'Escape' closes search mode and restores active conversations
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && (isSearchMode || searchQuery)) {
        handleCloseSearch();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchMode, searchQuery, handleCloseSearch]);

  const handleOpenSearchMode = () => {
    setIsSearchMode(true);
    onOpenNewChat?.();
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 40);
  };

  return (
    <aside className="w-full h-full min-h-0 flex flex-col bg-[#053b53] border-r border-[#4D8DBA]/30 z-20 shrink-0 select-none overflow-hidden relative">

      {/* 1. Header Bar: Profile Avatar + Username + Notification Bell + New Chat Button */}
      <div className="h-16 px-4 bg-[#086288] border-b border-[#4D8DBA]/35 backdrop-blur-xl flex items-center justify-between shrink-0 relative z-50">
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

          {/* New Chat Button: Triggers Search & Contacts Mode */}
          <button
            type="button"
            onClick={handleOpenSearchMode}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-[#4D8DBA] hover:bg-[#97D7FF] text-white hover:text-[#086288] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#086288]/40 transition active:scale-95 cursor-pointer"
            title={t("newChat", "New Chat")}
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Outer Search & Contacts Container wrapped with click-outside ref */}
      <div ref={searchContainerRef} className="flex-1 min-h-0 flex flex-col overflow-hidden relative">

        {/* 2. Search Bar: Clean input, supports focus trigger & WhatsApp-style back arrow */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="relative flex items-center w-full">
            {isSearchMode ? (
              <button
                type="button"
                onClick={handleCloseSearch}
                className="w-7 h-7 absolute left-2 rounded-full hover:bg-white/10 active:bg-white/20 text-[#97D7FF] flex items-center justify-center transition cursor-pointer z-10"
                title="Back to active chats"
                aria-label="Back to active chats"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <Search className="w-4 h-4 text-slate-300 absolute left-3.5 pointer-events-none" />
            )}

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchMode(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (!isSearchMode) setIsSearchMode(true);
              }}
              placeholder={t("searchNameOrUsername", "Search name or username...")}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={cn(
                "w-full h-10 pr-9 rounded-full bg-[#032433] border border-[#4D8DBA]/40 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition",
                isSearchMode ? "pl-10" : "pl-10"
              )}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer z-10"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. CONDITIONAL VIEW: Search Mode (SearchPanel) vs Active Conversations Mode (Default) */}
        {isSearchMode ? (
          /* SEARCH MODE: Live Directory Search & Registered Users View ("CONTACTS ON SIX9CHAT") */
          <SearchPanel
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            currentUser={currentUser}
            contacts={contacts}
            onSelectContact={(id) => {
              onSelectContact(id);
              handleCloseSearch();
            }}
            onClose={handleCloseSearch}
            onOpenNewGroup={onOpenNewGroup}
            onSendChatRequest={onSendChatRequest}
            onDeleteContact={onDeleteContact}
          />
        ) : (
          /* ACTIVE CONVERSATIONS MODE (DEFAULT): Persistent Accepted Friends, Active Chats, Unread Badges */
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Filter Pill Tabs: All, Unread, Pinned, Groups */}
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

            {/* Chat List — renders active conversations persistently */}
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
                isLoading={isLoadingContacts}
                onSelectContact={onSelectContact}
                onBlockUser={onBlockUser}
                onUnblockUser={onUnblockUser}
                onClearChat={onClearChat}
                onDeleteChat={onDeleteChat}
                onUnfriend={onUnfriend}
                onDeleteContact={onDeleteContact}
              />
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
