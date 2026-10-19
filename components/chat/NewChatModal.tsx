"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Users,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Check,
  UserPlus,
  CheckCircle2,
  Camera,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { ChatContact } from "@/types/chat";
import { Avatar } from "@/components/ui/Avatar";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export interface DirectoryUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  status: string;
  email?: string;
  about?: string;
  uid?: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  contacts: ChatContact[];
  currentUserId?: string;
  onClose: () => void;
  onSelectContact: (id: string) => void;
  onCreateGroup: (name: string, memberIds: string[], avatarUrl?: string) => void;
  onSendRequest?: (userId: string, name?: string, username?: string, avatar?: string) => Promise<void> | void;
  onAddNewContact?: (name: string, phoneOrUid: string, avatarUrl?: string, targetUserId?: string) => void;
}

export function NewChatModal({
  isOpen,
  contacts,
  currentUserId,
  onClose,
  onSelectContact,
  onCreateGroup,
  onSendRequest,
  onAddNewContact,
}: NewChatModalProps) {
  // Modal Navigation Mode: 'directory' | 'group-select' | 'group-details'
  const [mode, setMode] = useState<"directory" | "group-select" | "group-details">("directory");

  // User Directory State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [currentLoggedInUser, setCurrentLoggedInUser] = useState<{ id?: string; email?: string } | null>(null);
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Group Creation State
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setCustomGroupAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // a) On component load (useEffect), run direct Supabase query: supabase.from('profiles').select('*')
  useEffect(() => {
    let isMounted = true;

    async function loadAllProfiles() {
      setIsLoading(true);
      try {
        // Resolve current logged in user id and email to filter out ONLY the current user
        let myId = currentUserId;
        let myEmail: string | undefined;

        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            if (!myId) myId = authData.user.id;
            myEmail = authData.user.email?.toLowerCase();
          }
        } catch (e) {
          console.warn("[NewChatModal] Current user identification note:", e);
        }

        if (isMounted) {
          setCurrentLoggedInUser({ id: myId, email: myEmail });
        }

        // Run direct Supabase query with debug diagnostics:
        const { data: allProfiles, error } = await supabase.from("profiles").select("*");
        console.log("SEARCH PROFILES DEBUG:", allProfiles, error);

        // Save all returned profiles into state
        if (isMounted) {
          if (Array.isArray(allProfiles) && allProfiles.length > 0) {
            setProfiles(allProfiles);
          } else {
            // Secondary fallback if direct anon query is blocked
            try {
              const res = await fetch("/api/user/directory", { cache: "no-store" });
              const json = await res.json();
              console.log("SEARCH PROFILES API FALLBACK DEBUG:", json);
              if (json.success && Array.isArray(json.users) && json.users.length > 0) {
                setProfiles(json.users);
              }
            } catch (apiErr) {
              console.warn("[NewChatModal] Directory API error:", apiErr);
            }
          }
        }
      } catch (err) {
        console.error("[NewChatModal] Failed to load profiles:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAllProfiles();

    // Real-time Supabase Subscription on 'profiles' table
    const channel = supabase
      .channel("public:profiles_directory_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          loadAllProfiles();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  // c) Filter out ONLY the current logged-in user (by matching user.id or user.email)
  const myId = currentLoggedInUser?.id || currentUserId;
  const myEmail = currentLoggedInUser?.email?.toLowerCase();

  const otherProfiles = profiles.filter((p) => {
    if (myId && p.id === myId) return false;
    if (myEmail && p.email?.toLowerCase() === myEmail) return false;
    return true;
  });

  // When typing in the search box, filter allProfiles locally by username, full_name, or email (case-insensitive)
  const searchTerm = searchFilter.trim().toLowerCase().replace(/^@+/, "");

  const searchedProfiles = searchTerm
    ? otherProfiles.filter(
        (p) =>
          p.username?.toLowerCase().includes(searchTerm) ||
          p.full_name?.toLowerCase().includes(searchTerm) ||
          p.fullName?.toLowerCase().includes(searchTerm) ||
          p.email?.toLowerCase().includes(searchTerm)
      )
    : otherProfiles;

  // d) Map to DirectoryUser list for direct rendering under "REGISTERED USERS"
  const displayedUsers: DirectoryUser[] = searchedProfiles.map((p: any) => ({
    id: p.id,
    username: p.username || `user_${p.id?.slice(0, 4)}`,
    fullName: p.full_name || p.fullName || p.username || "Six9 Member",
    email: p.email || "",
    avatarUrl: p.avatar_url || p.avatarUrl || "",
    about: p.about || p.status || "Hey there! I am using Six9Chat",
    status: p.status || p.about || "Hey there! I am using Six9Chat",
    uid: p.uid || "S9-01",
  }));

  // Filter accepted connected contacts for group creation (excluding groups)
  const connectedContacts = contacts.filter((c) => !c.isGroup);
  const filteredContacts = connectedContacts.filter((c) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  // Set of connected contact IDs
  const connectedIds = new Set(connectedContacts.map((c) => c.id));

  // Initialize 1-on-1 direct conversation with selected user and add to active contacts sidebar
  const handleStartDirectChat = async (user: DirectoryUser) => {
    if (onAddNewContact) {
      onAddNewContact(
        user.fullName || user.username,
        user.username || user.email || "user",
        user.avatarUrl,
        user.id
      );
    } else {
      onSelectContact(user.id);
    }

    if (currentUserId && user.id && !connectedIds.has(user.id)) {
      try {
        if (onSendRequest) {
          await onSendRequest(user.id, user.fullName, user.username, user.avatarUrl);
        } else {
          await fetch("/api/user/send-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderId: currentUserId,
              receiverId: user.id,
              message: "wants to start a conversation with you",
            }),
          });
        }
      } catch (err) {
        console.warn("Background chat request notice:", err);
      }
    }

    handleClose();
  };

  // Handle Send Chat Request
  const handleSendRequest = async (user: DirectoryUser) => {
    try {
      setSendingId(user.id);
      if (onSendRequest) {
        await onSendRequest(user.id, user.fullName, user.username, user.avatarUrl);
      } else {
        await fetch("/api/user/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: currentUserId,
            receiverId: user.id,
            message: "wants to start a conversation with you",
          }),
        });
      }

      setSentRequestIds((prev) => new Set(prev).add(user.id));
      setToastMessage(`Request sent to @${user.username}!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Failed to send chat request:", err);
    } finally {
      setSendingId(null);
    }
  };

  // Group Multi-Select Handlers
  const toggleSelectContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeSelectedContact = (id: string) => {
    setSelectedContactIds((prev) => prev.filter((item) => item !== id));
  };

  const handleGroupPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomGroupAvatar(url);
    }
  };

  const handleFinishGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedContactIds.length === 0) return;

    onCreateGroup(groupName.trim(), selectedContactIds, groupAvatar || undefined);
    // Reset modal
    setMode("directory");
    setSelectedContactIds([]);
    setGroupName("");
    setCustomGroupAvatar(null);
    onClose();
  };

  const handleClose = () => {
    setMode("directory");
    setSelectedContactIds([]);
    setGroupName("");
    setCustomGroupAvatar(null);
    setSearchFilter("");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-[#086288] border border-[#4D8DBA]/60 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100"
        >
          {/* ============================================================== */}
          {/* HEADER BAR                                                     */}
          {/* ============================================================== */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#086288] border-b border-[#4D8DBA]/35 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {mode !== "directory" && (
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "group-details") setMode("group-select");
                    else setMode("directory");
                  }}
                  className="p-1 -ml-1 rounded-full text-slate-200 hover:text-white hover:bg-[#4D8DBA]/30 transition"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4D8DBA]/30 text-[#97D7FF] flex items-center justify-center shrink-0">
                  {mode === "directory" ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {mode === "directory" && "New Chat"}
                    {mode === "group-select" && "Add group members"}
                    {mode === "group-details" && "New group details"}
                  </h3>
                  <p className="text-[11px] text-slate-200">
                    {mode === "directory" && "Discover users & start conversations"}
                    {mode === "group-select" && `${selectedContactIds.length} contacts selected`}
                    {mode === "group-details" && "Name your group to start chatting"}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full text-slate-200 hover:text-white hover:bg-[#4D8DBA]/30 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Toast Feedback */}
          {toastMessage && (
            <div className="mx-4 mt-2 px-3 py-1.5 rounded-xl bg-[#053b53] border border-[#97D7FF]/60 text-[#97D7FF] text-xs font-semibold flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* 1. DIRECTORY VIEW                                              */}
          {/* ============================================================== */}
          {mode === "directory" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 pt-3">
              {/* Search Bar */}
              <div className="relative mb-3 shrink-0">
                <div className="relative flex items-center bg-[#053b53] border border-[#4D8DBA]/40 rounded-xl px-3 py-2 text-xs focus-within:border-[#97D7FF] focus-within:ring-1 focus-within:ring-[#97D7FF] transition">
                  <Search className="w-4 h-4 text-[#4D8DBA] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search users by username or name..."
                    className="w-full bg-transparent text-white placeholder-slate-300 outline-none text-xs sm:text-sm"
                    autoFocus
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter("")}
                      className="text-slate-300 hover:text-white ml-1 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Row: New group button */}
              <div
                onClick={() => setMode("group-select")}
                className="mb-3 p-3 rounded-2xl bg-[#053b53]/80 hover:bg-[#4D8DBA]/30 border border-[#4D8DBA]/40 flex items-center gap-3 cursor-pointer transition select-none group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#086288] to-[#97D7FF] text-[#053b53] flex items-center justify-center font-bold shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#97D7FF] transition-colors">
                    New group
                  </h4>
                  <p className="text-[11px] text-slate-200 truncate">
                    Create community with multiple contacts
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#97D7FF] group-hover:translate-x-1 transition-transform shrink-0" />
              </div>

              {/* Section Header: Real-time Registered Users */}
              <div className="flex items-center justify-between pb-1.5 px-1 shrink-0 border-b border-[#4D8DBA]/25">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFEFC4] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#97D7FF]" />
                  <span>Registered Users ({displayedUsers.length})</span>
                </span>
                <span className="text-[10px] font-mono text-[#97D7FF]/80">
                  Real-time Directory
                </span>
              </div>

              {/* Real-time Users List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-2 divide-y divide-[#4D8DBA]/20">
                {isLoading && profiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                    <Loader2 className="w-7 h-7 text-[#97D7FF] animate-spin mb-2" />
                    <p className="text-xs font-semibold text-slate-200">
                      Loading registered users...
                    </p>
                  </div>
                ) : displayedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-slate-300">
                    <p className="text-xs font-bold text-red-200 flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span>{searchTerm ? "User not found" : "No users found"}</span>
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1 max-w-[220px]">
                      {searchTerm
                        ? `No registered user matches "${searchTerm}". Try another username.`
                        : "No other registered users in the network yet."}
                    </p>
                  </div>
                ) : (
                  displayedUsers.map((user) => {
                    const isConnected = connectedIds.has(user.id);
                    const isRequested = sentRequestIds.has(user.id);
                    const isBusy = sendingId === user.id;

                    return (
                      <div
                        key={user.id}
                        onClick={() => handleStartDirectChat(user)}
                        className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-[#4D8DBA]/25 transition cursor-pointer select-none group"
                      >
                        {/* User DP + Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-10 h-10 shrink-0 shadow-md ring-1 ring-[#4D8DBA]/40 group-hover:ring-[#97D7FF]"
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#97D7FF] transition-colors">
                              {user.fullName}
                            </h4>
                            <p className="text-[11px] font-mono text-[#97D7FF] truncate">
                              @{user.username.replace(/^@/, "")}
                            </p>
                            {user.email && (
                              <p className="text-[10px] text-slate-300 truncate opacity-80">
                                {user.email}
                              </p>
                            )}
                            {user.status && (
                              <p className="text-[10px] text-slate-400 truncate">
                                {user.status}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="shrink-0 pl-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartDirectChat(user);
                            }}
                            className={cn(
                              "px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer",
                              isConnected
                                ? "bg-[#053b53] hover:bg-[#4D8DBA]/40 text-[#97D7FF] hover:text-white border border-[#4D8DBA]/60"
                                : "bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] hover:brightness-105 text-[#086288]"
                            )}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{isConnected ? "Chat" : "+ Chat"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. GROUP CREATION: STEP 1 (MEMBER SELECTION)                   */}
          {/* ============================================================== */}
          {mode === "group-select" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
              {/* Selected Contact Chips */}
              {selectedContactIds.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-2 shrink-0 no-scrollbar">
                  {selectedContactIds.map((id) => {
                    const c = connectedContacts.find((item) => item.id === id);
                    if (!c) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#053b53] border border-[#4D8DBA]/50 text-xs text-slate-100 shrink-0 shadow-sm"
                      >
                        <Avatar
                          src={c.avatar}
                          alt={c.name}
                          className="w-4 h-4 shrink-0 shadow-xs"
                          iconClassName="w-3/5 h-3/5 text-slate-200"
                        />
                        <span className="max-w-[85px] truncate text-[11px] font-semibold">{c.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedContact(id)}
                          className="text-slate-300 hover:text-white ml-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search contacts input */}
              <div className="relative mb-3 shrink-0">
                <Search className="w-4 h-4 text-[#4D8DBA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search connected contacts..."
                  className="w-full bg-[#053b53] border border-[#4D8DBA]/40 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-300 focus:outline-none focus:border-[#97D7FF]"
                  autoFocus
                />
              </div>

              {/* Connected Contacts List with Checkboxes */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {connectedContacts.length === 0 ? (
                  <div className="py-12 px-4 text-center text-slate-300 flex flex-col items-center justify-center">
                    <Users className="w-10 h-10 text-[#4D8DBA] mb-2 stroke-[1.5]" />
                    <p className="text-xs font-bold text-white">No connected contacts yet</p>
                    <p className="text-[11px] text-slate-300 mt-1 max-w-[220px]">
                      Send chat requests to users in the directory first to connect and add them to groups.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode("directory")}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-[#4D8DBA] hover:bg-[#97D7FF] text-white hover:text-[#086288] text-xs font-bold transition cursor-pointer"
                    >
                      Back to Directory
                    </button>
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isSelected = selectedContactIds.includes(contact.id);
                    return (
                      <div
                        key={contact.id}
                        onClick={() => toggleSelectContact(contact.id)}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition select-none border",
                          isSelected
                            ? "bg-[#4D8DBA]/35 border-[#97D7FF]/60 shadow-md"
                            : "bg-[#053b53]/60 hover:bg-[#4D8DBA]/20 border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={contact.avatar}
                            alt={contact.name}
                            className="w-10 h-10 shadow-md shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">
                              {contact.name}
                            </h4>
                            <p className="text-[11px] text-slate-300 truncate">
                              {contact.about || contact.phone || "Six9Chat Contact"}
                            </p>
                          </div>
                        </div>

                        {/* WhatsApp-style Checkbox */}
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ml-2",
                            isSelected
                              ? "bg-[#97D7FF] border-[#97D7FF] text-[#086288]"
                              : "border-[#4D8DBA]/60 bg-[#053b53]"
                          )}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Next Step Button */}
              {connectedContacts.length > 0 && (
                <div className="pt-3 border-t border-[#4D8DBA]/35 flex justify-end shrink-0">
                  <button
                    type="button"
                    disabled={selectedContactIds.length === 0}
                    onClick={() => setMode("group-details")}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] hover:brightness-105 active:scale-98 text-[#086288] font-black text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 transition cursor-pointer"
                  >
                    <span>Next ({selectedContactIds.length} members)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. GROUP CREATION: STEP 2 (GROUP DETAILS & FINALIZE)           */}
          {/* ============================================================== */}
          {mode === "group-details" && (
            <form onSubmit={handleFinishGroup} className="flex-1 flex flex-col p-5 overflow-y-auto">
              {/* Group Avatar Upload */}
              <div className="flex flex-col items-center mb-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGroupPhoto}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#086288] via-[#4D8DBA] to-[#97D7FF] p-0.5 shadow-xl cursor-pointer hover:scale-105 transition"
                  title="Upload group icon"
                >
                  <div className="w-full h-full rounded-full bg-[#053b53] overflow-hidden flex items-center justify-center text-white">
                    <Avatar
                      src={groupAvatar}
                      alt={groupName || "Group"}
                      className="w-full h-full"
                      iconClassName="w-10 h-10 text-slate-200"
                    />
                  </div>

                  <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#97D7FF] text-[#086288] shadow-md hover:scale-110 transition">
                    <Camera className="w-3.5 h-3.5 font-bold" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 mt-2">
                  Click to add group icon (optional)
                </p>
              </div>

              {/* Group Name Input */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Group Subject / Name
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Provide a group name (e.g. Design Team)"
                  className="w-full bg-[#053b53] border border-[#4D8DBA]/50 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                  autoFocus
                />
              </div>

              {/* Selected Members Summary */}
              <div className="mb-6 p-3 rounded-xl bg-[#053b53]/80 border border-[#4D8DBA]/35">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#FFEFC4] mb-1.5">
                  Members in Group ({selectedContactIds.length + 1})
                </p>
                <p className="text-xs text-slate-200">
                  You,{" "}
                  {selectedContactIds
                    .map((id) => connectedContacts.find((c) => c.id === id)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              {/* Create Group Action Button */}
              <div className="mt-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("group-select")}
                  className="flex-1 py-2.5 rounded-xl bg-[#053b53] hover:bg-[#4D8DBA]/30 text-slate-200 font-semibold text-xs transition cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={!groupName.trim() || selectedContactIds.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] hover:brightness-105 active:scale-95 text-[#086288] font-black text-xs flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-40 transition cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Create Group</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
