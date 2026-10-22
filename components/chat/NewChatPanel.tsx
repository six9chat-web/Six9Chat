"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Users,
  X,
  Loader2,
  MessageSquare,
  Trash2,
  Check,
  UserPlus,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ChatContact, UserProfile } from "@/types/chat";
import { supabase } from "@/lib/supabaseClient";

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
  onSendChatRequest?: (targetUserId: string) => Promise<void> | void;
  onDeleteContact?: (contactId: string) => void;
}

export function NewChatPanel({
  isOpen,
  onClose,
  currentUser,
  contacts,
  onSelectContact,
  onAddNewContact,
  onOpenNewGroup,
  onSendChatRequest,
  onDeleteContact,
}: NewChatPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState<DirectoryUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [removedUserIds, setRemovedUserIds] = useState<Set<string>>(new Set());
  const [requestingUserId, setRequestingUserId] = useState<string | null>(null);

  // Load existing pending requests sent by currentUser
  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;
    supabase
      .from("chat_requests")
      .select("receiver_id")
      .eq("sender_id", currentUser.id)
      .eq("status", "pending")
      .then((res: any) => {
        if (res?.data) {
          setSentRequests(new Set(res.data.map((r: any) => r.receiver_id)));
        }
      });
  }, [isOpen, currentUser?.id]);

  const handleSendRequest = async (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    try {
      setRequestingUserId(user.id);
      if (onSendChatRequest) {
        await onSendChatRequest(user.id);
      } else {
        await fetch("/api/user/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: user.id,
            message: `${currentUser.name || "User"} wants to start a conversation with you`,
          }),
        });
      }
      setSentRequests((prev) => new Set(prev).add(user.id));
    } catch (err) {
      console.warn("Could not send chat request:", err);
    } finally {
      setRequestingUserId(null);
    }
  };

  const handleRemoveUser = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setRemovedUserIds((prev) => new Set(prev).add(userId));
    onDeleteContact?.(userId);
  };

  // Live user fetch from Supabase `profiles` table (with API fallback)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const cleanTerm = searchQuery.trim().replace(/^@/, "");

    const fetchProfiles = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        // 1. Direct query against Supabase profiles table
        let sbQuery = supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, about");

        if (currentUser?.id) {
          sbQuery = sbQuery.neq("id", currentUser.id);
        }

        if (cleanTerm) {
          sbQuery = sbQuery.or(
            `username.ilike.%${cleanTerm}%,full_name.ilike.%${cleanTerm}%`
          );
        }

        sbQuery = sbQuery.limit(50);

        const { data: profiles, error } = await sbQuery;

        if (!error && Array.isArray(profiles)) {
          if (isMounted) {
            setRegisteredUsers(
              profiles.map((p: any) => ({
                id: p.id,
                username: p.username || `user_${p.id.slice(0, 4)}`,
                fullName: p.full_name || p.username || "",
                avatarUrl: p.avatar_url || "",
                about: p.about || "Hey there! I am using Six9Chat",
              }))
            );
          }
          if (profiles.length > 0 || cleanTerm) {
            return;
          }
        }

        // 2. Server API fallback for memory cache or cold-start fallback
        const endpoint = cleanTerm
          ? `/api/user/search?searchTerm=${encodeURIComponent(cleanTerm)}${
              currentUser?.id ? `&excludeId=${encodeURIComponent(currentUser.id)}` : ""
            }`
          : `/api/user/directory${
              currentUser?.id ? `?excludeId=${encodeURIComponent(currentUser.id)}` : ""
            }`;

        const res = await fetch(endpoint);
        if (res.ok) {
          const apiData = await res.json();
          if (isMounted && Array.isArray(apiData.users)) {
            setRegisteredUsers(apiData.users);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn("[NewChatPanel] fetch users error:", err);
          setFetchError("Unable to load contacts");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchProfiles, cleanTerm ? 220 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, searchQuery, currentUser?.id]);

  // Combine contacts and registered users, deduplicated by ID
  const displayedUsers = useMemo(() => {
    const isSelfUser = (userId?: string, uname?: string, email?: string, fname?: string) => {
      if (!currentUser) return false;
      if (currentUser.id && userId && String(userId).toLowerCase() === String(currentUser.id).toLowerCase()) return true;
      if (currentUser.username && uname && uname.toLowerCase().replace(/^@+/, "") === currentUser.username.toLowerCase().replace(/^@+/, "")) return true;
      if (currentUser.name && fname && fname.toLowerCase() === currentUser.name.toLowerCase() && currentUser.name !== "You") return true;
      if (currentUser.name && uname && uname.toLowerCase() === currentUser.name.toLowerCase() && currentUser.name !== "You") return true;
      if (currentUser.email && email && email.toLowerCase() === currentUser.email.toLowerCase()) return true;
      return false;
    };

    const map = new Map<
      string,
      {
        id: string;
        displayName: string;
        username: string;
        avatar: string;
        about: string;
        isExistingContact: boolean;
      }
    >();

    // 1. Existing contacts in current conversation list
    contacts.forEach((c) => {
      if (isSelfUser(c.id, c.name, c.phone, c.name)) return;
      const cleanUsername = c.name.startsWith("@") ? c.name.slice(1) : c.name;
      map.set(c.id, {
        id: c.id,
        displayName: cleanUsername,
        username: cleanUsername,
        avatar: c.avatar || "",
        about: c.about || "Active chat",
        isExistingContact: true,
      });
    });

    // 2. Supabase registered users
    registeredUsers.forEach((u) => {
      if (isSelfUser(u.id, u.username, (u as any).email, u.fullName)) return;
      const cleanUsername = (u.username || "").replace(/^@/, "") || u.fullName || "User";
      const existing = map.get(u.id);
      if (existing) {
        map.set(u.id, {
          ...existing,
          displayName: cleanUsername,
          username: cleanUsername,
          avatar: u.avatarUrl || existing.avatar,
          about: u.about || existing.about,
        });
      } else {
        map.set(u.id, {
          id: u.id,
          displayName: cleanUsername,
          username: cleanUsername,
          avatar: u.avatarUrl || "",
          about: u.about || "Hey there! I am using Six9Chat",
          isExistingContact: false,
        });
      }
    });

    const list = Array.from(map.values()).filter((u) => !isSelfUser(u.id, u.username));
    const q = searchQuery.trim().toLowerCase().replace(/^@/, "");
    if (!q) return list;

    return list.filter(
      (u) =>
        !isSelfUser(u.id, u.username) &&
        (u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q))
    );
  }, [contacts, registeredUsers, currentUser, searchQuery]);

  const visibleUsers = useMemo(() => {
    return displayedUsers.filter((u) => !removedUserIds.has(u.id));
  }, [displayedUsers, removedUserIds]);

  // Instant Conversation Trigger: Check/create conversation in DB, activate, and close panel
  const handleSelectUser = useCallback(
    async (user: {
      id: string;
      displayName: string;
      username: string;
      avatar: string;
      isExistingContact: boolean;
    }) => {
      setIsStartingChat(user.id);
      try {
        if (currentUser?.id && user.id) {
          // Check/create 1-on-1 row in conversations table
          await fetch("/api/chat/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.id,
              partnerId: user.id,
            }),
          }).catch((e) => console.warn("Conversation trigger notice:", e));
        }

        if (user.isExistingContact) {
          onSelectContact(user.id);
        } else if (onAddNewContact) {
          onAddNewContact(
            user.displayName || user.username,
            user.username,
            user.avatar,
            user.id
          );
        } else {
          onSelectContact(user.id);
        }
      } catch (err) {
        console.warn("[NewChatPanel] handleSelectUser notice:", err);
        onSelectContact(user.id);
      } finally {
        setIsStartingChat(null);
        onClose();
      }
    },
    [currentUser?.id, onSelectContact, onAddNewContact, onClose]
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
      {/* 1. Header: Back Arrow + "New chat" */}
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

      {/* 3. Action List: Only "New group" (User Directory completely removed) */}
      {!searchQuery && (
        <div className="border-b border-[#4D8DBA]/25 shrink-0">
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
        </div>
      )}

      {/* 4. Section Divider */}
      <div className="px-4 py-2 text-[11px] font-bold text-[#97D7FF] uppercase tracking-wider bg-[#032433]/50 border-b border-[#4D8DBA]/20 shrink-0 flex items-center justify-between">
        <span>Contacts on Six9Chat</span>
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-[#97D7FF] animate-spin" />}
      </div>

      {/* 5. Scrollable Contacts & Registered Users List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#4D8DBA]/10 custom-scrollbar">
        {isLoading && visibleUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
            <Loader2 className="w-7 h-7 text-[#97D7FF] animate-spin mb-3" />
            <p className="text-xs text-slate-300">Loading contacts...</p>
          </div>
        ) : visibleUsers.length === 0 ? (
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
          visibleUsers.map((user) => (
            <div
              key={user.id}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#086288]/40 transition text-left group"
            >
              {/* Left clickable info area */}
              <div
                onClick={() => handleSelectUser(user)}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={user.avatar}
                    alt={user.displayName || user.username}
                    className="w-11 h-11 rounded-full ring-1 ring-[#97D7FF]/30 group-hover:scale-105 transition"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-[#97D7FF] transition">
                    {user.username || user.displayName}
                  </h3>
                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    {user.about}
                  </p>
                </div>
              </div>

              {/* Right Action Buttons: "Request" / "Chat" + "Delete / Remove" */}
              <div className="flex items-center gap-1.5 shrink-0">
                {user.isExistingContact ? (
                  <button
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="px-2.5 py-1 rounded-lg bg-[#4D8DBA]/30 hover:bg-[#4D8DBA]/60 text-[#97D7FF] text-xs font-semibold transition cursor-pointer"
                  >
                    Chat
                  </button>
                ) : sentRequests.has(user.id) ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#4D8DBA]/20 text-[#97D7FF] font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Pending</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={requestingUserId === user.id}
                    onClick={(e) => handleSendRequest(e, user)}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] text-[#086288] hover:brightness-105 active:scale-95 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                    title="Send chat request"
                  >
                    {requestingUserId === user.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Request</span>
                      </>
                    )}
                  </button>
                )}

                {/* Delete / Remove action */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveUser(e, user.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                  title="Delete / Remove from view"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}

        {fetchError && visibleUsers.length === 0 && (
          <div className="p-4 text-center text-xs text-rose-300">
            {fetchError}
          </div>
        )}
      </div>
    </motion.div>
  );
}
