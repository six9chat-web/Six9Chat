"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Loader2,
  MessageSquare,
  Trash2,
  Check,
  UserPlus,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ChatContact, UserProfile } from "@/types/chat";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "@/lib/LanguageContext";

export interface DirectoryUserItem {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  about?: string;
}

interface SearchPanelProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser: UserProfile;
  contacts: ChatContact[];
  onSelectContact: (id: string) => void;
  onClose: () => void;
  onOpenNewGroup?: () => void;
  onSendChatRequest?: (targetUserId: string) => Promise<void> | void;
  onDeleteContact?: (contactId: string) => void;
}

export function SearchPanel({
  searchQuery,
  onSearchChange: _onSearchChange,
  currentUser,
  contacts,
  onSelectContact,
  onClose,
  onOpenNewGroup,
  onSendChatRequest,
  onDeleteContact,
}: SearchPanelProps) {
  const { t } = useTranslation();
  const [registeredUsers, setRegisteredUsers] = useState<DirectoryUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [removedUserIds, setRemovedUserIds] = useState<Set<string>>(new Set());
  const [requestingUserId, setRequestingUserId] = useState<string | null>(null);

  // Load existing pending requests involving currentUser in either direction
  useEffect(() => {
    if (!currentUser?.id) return;
    supabase
      .from("chat_requests")
      .select("sender_id, receiver_id, status")
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .in("status", ["pending", "accepted"])
      .then((res: { data: Array<{ sender_id: string; receiver_id: string; status: string }> | null }) => {
        if (res?.data) {
          const ids = new Set<string>();
          res.data.forEach((r) => {
            const partner = r.sender_id === currentUser.id ? r.receiver_id : r.sender_id;
            if (partner) ids.add(partner);
          });
          setSentRequests(ids);
        }
      });
  }, [currentUser?.id]);

  const handleSendRequest = async (e: React.MouseEvent, user: { id: string }) => {
    e.stopPropagation();
    if (requestingUserId === user.id || sentRequests.has(user.id)) return;

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
    let isMounted = true;
    const cleanTerm = searchQuery.trim().replace(/^@/, "");

    const fetchProfiles = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
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
              profiles.map((p: { id: string; username?: string; full_name?: string; avatar_url?: string; about?: string }) => ({
                id: p.id,
                username: p.username || "User",
                fullName: p.username || "",
                avatarUrl: p.avatar_url || "",
                about: p.about || "Hey there! I am using Six9Chat",
              }))
            );
          }
          if (profiles.length > 0 || cleanTerm) {
            return;
          }
        }

        // Server API fallback
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
          console.warn("[SearchPanel] fetch users error:", err);
          setFetchError("Unable to load contacts");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchProfiles, cleanTerm ? 180 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUser?.id]);

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
      const exactUsername = c.name;
      map.set(c.id, {
        id: c.id,
        displayName: exactUsername,
        username: exactUsername,
        avatar: c.avatar || "",
        about: c.about || "Active chat",
        isExistingContact: true,
      });
    });

    // 2. Supabase registered users
    registeredUsers.forEach((u) => {
      if (isSelfUser(u.id, u.username, undefined, u.fullName)) return;
      const exactUsername = u.username || "User";
      const existing = map.get(u.id);
      if (existing) {
        map.set(u.id, {
          ...existing,
          displayName: exactUsername,
          username: exactUsername,
          avatar: u.avatarUrl || existing.avatar,
        });
      } else {
        map.set(u.id, {
          id: u.id,
          displayName: exactUsername,
          username: exactUsername,
          avatar: u.avatarUrl || "",
          about: u.about || "Hey there! I am using Six9Chat",
          isExistingContact: false,
        });
      }
    });

    const q = searchQuery.trim().toLowerCase().replace(/^@/, "");
    if (!q) {
      return Array.from(map.values());
    }

    return Array.from(map.values()).filter(
      (u) =>
        !isSelfUser(u.id, u.username) &&
        (u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q))
    );
  }, [contacts, registeredUsers, currentUser, searchQuery]);

  const visibleUsers = useMemo(() => {
    return displayedUsers.filter((u) => !removedUserIds.has(u.id));
  }, [displayedUsers, removedUserIds]);

  const handleSelectUser = useCallback(
    (user: {
      id: string;
      displayName: string;
      username: string;
      avatar: string;
      isExistingContact: boolean;
    }) => {
      if (!user.isExistingContact) {
        return;
      }
      onSelectContact(user.id);
      onClose();
    },
    [onSelectContact, onClose]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#053b53] select-none overflow-hidden relative">
      {/* 1. Action List: "New group" if search query is empty */}
      {!searchQuery && (
        <div className="border-b border-[#4D8DBA]/25 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewGroup?.();
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3.5 hover:bg-[#086288]/30 active:bg-[#086288]/50 transition text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#086288] to-[#4D8DBA] flex items-center justify-center text-white ring-1 ring-[#97D7FF]/30 shadow-md group-hover:scale-105 transition">
              <Users className="w-5 h-5 text-[#97D7FF]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white tracking-tight group-hover:text-[#97D7FF] transition">
                {t("newGroup", "New group")}
              </span>
              <span className="text-[11px] text-slate-300 truncate">
                {t("createGroupDesc", "Create a group chat with friends")}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 2. Section Divider: "CONTACTS ON SIX9CHAT" */}
      <div className="px-4 py-2 text-[11px] font-bold text-[#97D7FF] uppercase tracking-wider bg-[#032433]/50 border-b border-[#4D8DBA]/20 shrink-0 flex items-center justify-between">
        <span>{t("contactsOnSix9Chat", "Contacts on Six9Chat")}</span>
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-[#97D7FF] animate-spin" />}
      </div>

      {/* 3. Scrollable Contacts & Registered Users List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#4D8DBA]/10 custom-scrollbar">
        {isLoading && visibleUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
            <Loader2 className="w-7 h-7 text-[#97D7FF] animate-spin mb-3" />
            <p className="text-xs text-slate-300">{t("searching", "Searching...")}</p>
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-[#032433] border border-[#4D8DBA]/40 flex items-center justify-center mb-3 shadow-lg">
              <MessageSquare className="w-5 h-5 text-[#4D8DBA]" />
            </div>
            <p className="text-sm font-bold text-white mb-1">
              {searchQuery ? t("noMatchingContacts", "No matching contacts") : t("noUsersFound", "No registered users found")}
            </p>
            <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed">
              {searchQuery
                ? t("noMatchingContactsDesc", `No user matches "${searchQuery.trim()}". Try searching for another username.`)
                : "Other registered users on Six9Chat will appear here."}
            </p>
          </div>
        ) : (
          visibleUsers.map((user) => (
            <div
              key={user.id}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#086288]/40 transition text-left group"
            >
              {/* Left info area: ONLY clickable if already an existing accepted contact */}
              <div
                onClick={() => (user.isExistingContact ? handleSelectUser(user) : undefined)}
                className={`flex items-center gap-3 min-w-0 flex-1 ${
                  user.isExistingContact ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={user.avatar}
                    alt={user.displayName || user.username}
                    className="w-10 h-10 rounded-full ring-1 ring-[#97D7FF]/30 group-hover:scale-105 transition"
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
                    {t("chat", "Chat")}
                  </button>
                ) : sentRequests.has(user.id) ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#4D8DBA]/20 text-[#97D7FF] font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{t("pending", "Pending")}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={requestingUserId === user.id || sentRequests.has(user.id)}
                    onClick={(e) => handleSendRequest(e, user)}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] text-[#086288] hover:brightness-105 active:scale-95 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Send chat request"
                  >
                    {requestingUserId === user.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ {t("request", "Request")}</span>
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
    </div>
  );
}

export default SearchPanel;
