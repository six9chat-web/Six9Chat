"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pin,
  CheckCheck,
  Check,
  Clock,
  Mic,
  Image as ImageIcon,
  FileText,
  Users,
  Phone,
  Trash2,
  ChevronDown,
  ShieldBan,
  Eraser,
  UserMinus,
  AlertTriangle,
} from "lucide-react";
import { ChatContact, MessageStatus } from "@/types/chat";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface ChatListProps {
  contacts: ChatContact[];
  activeContactId: string;
  onSelectContact: (id: string) => void;
  onBlockUser?: (id: string) => void;
  onUnblockUser?: (id: string) => void;
  onClearChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  onUnfriend?: (id: string) => void;
  onDeleteContact?: (id: string) => void;
}

export function ChatList({
  contacts,
  activeContactId,
  onSelectContact,
  onBlockUser,
  onUnblockUser,
  onClearChat,
  onDeleteChat,
  onUnfriend,
  onDeleteContact,
}: ChatListProps) {
  const [openMenuContactId, setOpenMenuContactId] = useState<string | null>(null);
  const [unfriendTargetContact, setUnfriendTargetContact] = useState<ChatContact | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (listContainerRef.current && !listContainerRef.current.contains(e.target as Node)) {
        setOpenMenuContactId(null);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenuContactId(null);
        setUnfriendTargetContact(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const renderStatusTicks = (status?: MessageStatus) => {
    switch (status) {
      case "sending":
        return <Clock className="w-3.5 h-3.5 text-[#4D8DBA] inline shrink-0" />;
      case "sent":
        return <Check className="w-3.5 h-3.5 text-slate-400 inline shrink-0" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline shrink-0" />;
      case "read":
        return <CheckCheck className="w-4 h-4 text-[#97D7FF] inline shrink-0" />;
      default:
        return null;
    }
  };

  const renderMediaIcon = (mediaType?: string) => {
    if (mediaType === "audio")
      return <Mic className="w-3.5 h-3.5 text-[#97D7FF] inline mr-1 shrink-0" />;
    if (mediaType === "image")
      return <ImageIcon className="w-3.5 h-3.5 text-[#97D7FF] inline mr-1 shrink-0" />;
    if (mediaType === "document")
      return <FileText className="w-3.5 h-3.5 text-[#FFEFC4] inline mr-1 shrink-0" />;
    if (mediaType === "call")
      return <Phone className="w-3.5 h-3.5 text-[#FFEFC4] inline mr-1 shrink-0" />;
    return null;
  };

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300 h-64 select-none">
        <Users className="w-10 h-10 stroke-[1.5] text-[#4D8DBA] mb-2" />
        <p className="text-sm font-semibold text-slate-200">No active chats yet</p>
        <p className="text-xs text-[#97D7FF]/80 mt-1 max-w-[220px] leading-relaxed">
          Search a user by Username in the search bar above to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div ref={listContainerRef} className="overflow-y-auto flex-1 min-h-0 select-none px-2 py-1 space-y-1 relative">
      {contacts.map((contact) => {
        const isActive = contact.id === activeContactId;
        const isMenuOpen = openMenuContactId === contact.id;
        const isUnread = !isActive && contact.unreadCount > 0;

        return (
          <div
            key={contact.id}
            className="relative"
            onMouseLeave={() => {
              // keep menu open if user clicked it, or dismiss on explicit action
            }}
          >
            <motion.div
              onClick={() => onSelectContact(contact.id)}
              whileHover={{ backgroundColor: "rgba(77, 141, 186, 0.25)" }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150",
                isActive
                  ? "bg-[#4D8DBA]/40 border border-[#4D8DBA]/60 shadow-lg shadow-[#086288]/40"
                  : "border border-transparent hover:border-[#4D8DBA]/25"
              )}
            >
              {/* 1. Circular DP on Left */}
              <div className="relative shrink-0">
                <Avatar
                  src={contact.avatar}
                  alt={contact.name}
                  className={cn(
                    "w-12 h-12 shadow-md transition-transform",
                    contact.avatarColor || "from-[#086288] to-[#4D8DBA]",
                    isActive && "ring-2 ring-[#97D7FF] scale-102"
                  )}
                />

                {/* Online / Activity Indicator */}
                {contact.status === "online" && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#97D7FF] ring-2 ring-[#053b53]" />
                )}
              </div>

              {/* 2. Middle & Right: Title on top left, Timestamp on top right */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={cn(
                      "text-sm font-semibold truncate transition-colors flex items-center gap-1.5",
                      isActive
                        ? "text-white font-bold"
                        : "text-slate-100 group-hover:text-white"
                    )}
                  >
                    <span className="truncate">{contact.name}</span>
                    {contact.isBlocked && (
                      <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded-md shrink-0">
                        Blocked
                      </span>
                    )}
                    {contact.isUnfriended && (
                      <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-md shrink-0">
                        Unfriended
                      </span>
                    )}
                    {contact.isUnfriendedByPartner && !contact.isUnfriended && (
                      <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-md shrink-0">
                        Unfriended you
                      </span>
                    )}
                  </span>

                  <span
                    className={cn(
                      "text-[11px] shrink-0 ml-2 transition-colors",
                      isUnread
                        ? "text-[#97D7FF] font-bold"
                        : isActive
                        ? "text-[#FFEFC4] font-medium"
                        : "text-slate-400 font-normal"
                    )}
                  >
                    {contact.lastMessage?.timestamp || ""}
                  </span>
                </div>

                {/* 3. Last Message Preview with status ticks / reaction emojis */}
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "text-xs truncate flex items-center gap-1.5 leading-snug transition-colors flex-1 min-w-0",
                      isUnread
                        ? "text-white font-bold tracking-tight"
                        : isActive
                        ? "text-slate-200 font-normal"
                        : "text-slate-400 font-normal group-hover:text-slate-200"
                    )}
                  >
                    {contact.lastMessage?.isSelf && (
                      <span>{renderStatusTicks(contact.lastMessage.status)}</span>
                    )}
                    {renderMediaIcon(contact.lastMessage?.mediaType)}
                    <span
                      className={cn(
                        "truncate",
                        isUnread ? "font-bold text-white" : "font-normal"
                      )}
                    >
                      {contact.lastMessage?.text || "No messages yet"}
                    </span>
                  </p>

                  {/* Right badges: Pin / Unread Count / WhatsApp-Style Down Arrow Trigger */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {contact.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-[#97D7FF] rotate-45 shrink-0" />
                    )}

                    {/* Unread badge: only rendered when user is NOT in this active room and count > 0 */}
                    {isUnread && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#97D7FF] text-[#053b53] font-black text-[11px] flex items-center justify-center shadow-md shadow-[#97D7FF]/40 ring-1 ring-[#97D7FF] shrink-0">
                        {contact.unreadCount}
                      </span>
                    )}

                    {/* WhatsApp-Style Down Arrow Trigger (Visible on Hover or when Menu is Open) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuContactId((prev) => (prev === contact.id ? null : contact.id));
                      }}
                      className={cn(
                        "p-1 rounded-full text-slate-300 hover:text-white hover:bg-[#086288] transition cursor-pointer shrink-0 z-20",
                        isMenuOpen
                          ? "opacity-100 bg-[#086288] text-white"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                      title="Chat options"
                      aria-label="Chat options"
                    >
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-150",
                          isMenuOpen && "rotate-180"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Dropdown Context Menu: Anchored with highest z-index */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -4 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ zIndex: 99999 }}
                  className="absolute right-3 top-12 w-48 rounded-2xl bg-[#032433] border border-[#4D8DBA]/70 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl ring-1 ring-[#97D7FF]/35 select-none text-slate-100"
                >
                  {/* 1. Block User */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuContactId(null);
                      if (contact.isBlocked) {
                        onUnblockUser?.(contact.id);
                      } else {
                        onBlockUser?.(contact.id);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#086288]/80 transition cursor-pointer text-left"
                  >
                    <ShieldBan className="w-4 h-4 text-[#97D7FF] shrink-0" />
                    <span>{contact.isBlocked ? "Unblock User" : "Block User"}</span>
                  </button>

                  {/* 2. Clear Chat */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuContactId(null);
                      onClearChat?.(contact.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#086288]/80 transition cursor-pointer text-left"
                  >
                    <Eraser className="w-4 h-4 text-[#FFEFC4] shrink-0" />
                    <span>Clear Chat</span>
                  </button>

                  {/* 3. Delete Chat */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuContactId(null);
                      if (onDeleteChat) {
                        onDeleteChat(contact.id);
                      } else {
                        onDeleteContact?.(contact.id);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#086288]/80 transition cursor-pointer text-left"
                  >
                    <Trash2 className="w-4 h-4 text-[#4D8DBA] shrink-0" />
                    <span>Delete Chat</span>
                  </button>

                  <div className="my-1 border-t border-[#4D8DBA]/25" />

                  {/* 4. Unfriend */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuContactId(null);
                      setUnfriendTargetContact(contact);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition cursor-pointer text-left"
                  >
                    <UserMinus className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Unfriend</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* 4. UNFRIEND CONFIRMATION POPUP MODAL */}
      <AnimatePresence>
        {unfriendTargetContact && (
          <div
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
            onClick={() => setUnfriendTargetContact(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#086288] border border-[#4D8DBA]/60 p-6 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Unfriend {unfriendTargetContact.name}?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to unfriend <strong>{unfriendTargetContact.name}</strong>?
                  This will remove them from your chat list and cancel your connected friendship in Six9Chat.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUnfriendTargetContact(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#053b53] hover:bg-[#053b53]/80 border border-[#4D8DBA]/40 text-xs font-bold text-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetId = unfriendTargetContact.id;
                    setUnfriendTargetContact(null);
                    onUnfriend?.(targetId);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer shadow-lg active:scale-95"
                >
                  Unfriend
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
