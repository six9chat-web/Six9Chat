"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Users,
  UserPlus,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ChatContact, UserProfile } from "@/types/chat";

export interface DirectoryUserItem {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  about?: string;
}

interface NewChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  contacts: ChatContact[];
  onSelectContact: (id: string) => void;
  onAddNewContact?: (
    name: string,
    phoneOrUid: string,
    avatarUrl?: string,
    targetUserId?: string
  ) => void;
  onOpenNewGroup?: () => void;
}

export function NewChatPanel({
  isOpen,
  onClose,
  currentUser,
  contacts,
  onSelectContact,
  onAddNewContact,
  onOpenNewGroup,
}: NewChatPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch initial network users from directory when opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchDirectory = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const excludeId = currentUser?.id ? `?excludeId=${encodeURIComponent(currentUser.id)}` : "";
        const res = await fetch(`/api/user/directory${excludeId}`);
        if (!res.ok) throw new Error("Could not load directory");
        const data = await res.json();
        if (isMounted && Array.isArray(data.users)) {
          setDirectoryUsers(data.users);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("[NewChatPanel] directory load notice:", err);
          setFetchError("Unable to load network directory");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDirectory();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser?.id]);

  // Dynamic server search when typing a search query
  useEffect(() => {
    if (!isOpen || !searchQuery.trim()) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const cleanTerm = searchQuery.trim().replace(/^@/, "");
        const excludeParam = currentUser?.id ? `&excludeId=${encodeURIComponent(currentUser.id)}` : "";
        const res = await fetch(`/api/user/search?searchTerm=${encodeURIComponent(cleanTerm)}${excludeParam}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data.users)) {
          setDirectoryUsers((prev) => {
            const map = new Map<string, DirectoryUserItem>();
            data.users.forEach((u: DirectoryUserItem) => map.set(u.id, u));
            prev.forEach((u) => {
              if (!map.has(u.id)) map.set(u.id, u);
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn("[NewChatPanel] search error:", err);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, isOpen, currentUser?.id]);

  // Combine active contacts and directory users, eliminating duplicates
  const allAvailableUsers = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      username: string;
      avatar: string;
      about: string;
      isExistingContact: boolean;
    }>();

    // 1. Add active contacts
    contacts.forEach((c) => {
      if (c.id === currentUser?.id) return;
      const cleanUsername = c.name.startsWith("@") ? c.name.slice(1) : c.name;
      map.set(c.id, {
        id: c.id,
        name: c.name,
        username: cleanUsername,
        avatar: c.avatar || "",
        about: c.about || "Active chat",
        isExistingContact: true,
      });
    });

    // 2. Add directory users
    directoryUsers.forEach((u) => {
      if (u.id === currentUser?.id) return;
      if (!map.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          name: u.fullName || u.username,
          username: u.username.replace(/^@/, ""),
          avatar: u.avatarUrl || "",
          about: u.about || "Hey there! I am using Six9Chat",
          isExistingContact: false,
        });
      }
    });

    return Array.from(map.values());
  }, [contacts, directoryUsers, currentUser?.id]);

  // Filter list based on clean search term
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^@/, "");
    if (!q) return allAvailableUsers;

    return allAvailableUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );
  }, [allAvailableUsers, searchQuery]);

  // Contact selection handler: activates existing conversation or creates new contact immediately
  const handleSelectUser = useCallback(
    (user: { id: string; name: string; username: string; avatar: string; isExistingContact: boolean }) => {
      if (user.isExistingContact) {
        onSelectContact(user.id);
      } else if (onAddNewContact) {
        onAddNewContact(user.name, user.username, user.avatar, user.id);
      } else {
        onSelectContact(user.id);
      }
      onClose();
    },
    [onSelectContact, onAddNewContact, onClose]
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
      className="absolute inset-0 z-30 flex flex-col bg-[#053b53] border-r border-[#4D8DBA]/30 overflow-hidden select-none"
    >
      {/* 1. WhatsApp Top Header: Back Arrow + "New chat" */}
      <div className="h-16 px-4 bg-[#086288] border-b border-[#4D8DBA]/35 backdrop-blur-xl flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full hover:bg-white/10 active:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          title="Back to chats"
          aria-label="Back to chats"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h2 className="text-lg font-bold text-white tracking-tight">New chat</h2>
      </div>

      {/* 2. Search Bar: Clean input, no email reference, disabled autocomplete */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-300 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or username..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full h-10 pl-10 pr-9 rounded-full bg-[#032433] border border-[#4D8DBA]/40 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Action List Items (WhatsApp Style Top Actions) */}
      {!searchQuery && (
        <div className="divide-y divide-[#4D8DBA]/15 border-b border-[#4D8DBA]/25 shrink-0">
          {/* New Group Action Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewGroup?.();
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-[#086288]/30 active:bg-[#086288]/50 transition text-left cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#086288] to-[#4D8DBA] flex items-center justify-center text-white ring-1 ring-[#97D7FF]/30 shadow-md group-hover:scale-105 transition">
              <Users className="w-5 h-5 text-[#97D7FF]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white tracking-tight group-hover:text-[#97D7FF] transition">
                New group
              </span>
              <span className="text-[11px] text-slate-300 truncate">
                Create a group chat with friends
              </span>
            </div>
          </button>

          {/* New Contact / User Directory Action */}
          <div className="w-full px-4 py-3 flex items-center gap-3.5 bg-[#032433]/30">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#053b53] to-[#086288] flex items-center justify-center text-white ring-1 ring-[#97D7FF]/20 shadow-md">
              <UserPlus className="w-5 h-5 text-[#97D7FF]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white tracking-tight">
                User Directory
              </span>
              <span className="text-[11px] text-slate-300 truncate">
                Browse network contacts below
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Section Divider */}
      <div className="px-4 py-2 text-[11px] font-bold text-[#97D7FF] uppercase tracking-wider bg-[#032433]/50 border-b border-[#4D8DBA]/20 shrink-0 flex items-center justify-between">
        <span>Contacts on Six9Chat</span>
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-[#97D7FF] animate-spin" />}
      </div>

      {/* 5. Scrollable Contacts & Network Users List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#4D8DBA]/10 custom-scrollbar">
        {isLoading && filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
            <Loader2 className="w-7 h-7 text-[#97D7FF] animate-spin mb-3" />
            <p className="text-xs text-slate-300">Loading contacts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-[#032433] border border-[#4D8DBA]/40 flex items-center justify-center mb-3 shadow-lg">
              <MessageSquare className="w-5 h-5 text-[#4D8DBA]" />
            </div>
            <p className="text-sm font-bold text-white mb-1">
              {searchQuery ? "No matching contacts" : "No registered users found"}
            </p>
            <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed">
              {searchQuery
                ? `No user matches "${searchQuery.trim()}". Try searching for another username.`
                : "Other registered users on Six9Chat will appear here."}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectUser(user)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#086288]/40 active:bg-[#086288]/60 transition text-left cursor-pointer group"
            >
              <div className="relative shrink-0">
                <Avatar
                  src={user.avatar}
                  alt={user.name || user.username}
                  className="w-11 h-11 rounded-full ring-1 ring-[#97D7FF]/30 group-hover:scale-105 transition"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-[#97D7FF] transition">
                    {user.name}
                  </h3>
                  {user.isExistingContact && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4D8DBA]/30 text-[#97D7FF] font-medium shrink-0">
                      Chat
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  {user.about}
                </p>
              </div>
            </button>
          ))
        )}

        {fetchError && filteredUsers.length === 0 && (
          <div className="p-4 text-center text-xs text-rose-300">
            {fetchError}
          </div>
        )}
      </div>
    </motion.div>
  );
}
