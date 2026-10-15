"use client";

import React from "react";
import { motion } from "framer-motion";
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
  Video,
} from "lucide-react";
import { ChatContact, MessageStatus } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatListProps {
  contacts: ChatContact[];
  activeContactId: string;
  onSelectContact: (id: string) => void;
}

export function ChatList({
  contacts,
  activeContactId,
  onSelectContact,
}: ChatListProps) {
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
          Search a user by their UID (e.g. S9-02) in the search bar above to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1 min-h-0 select-none px-2 py-1 space-y-1">
      {contacts.map((contact) => {
        const isActive = contact.id === activeContactId;

        return (
          <motion.div
            key={contact.id}
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
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md bg-gradient-to-tr transition-transform overflow-hidden",
                  contact.avatarColor || "from-[#086288] to-[#4D8DBA]",
                  isActive && "ring-2 ring-[#97D7FF] scale-102"
                )}
              >
                {contact.avatar && (contact.avatar.startsWith("http") || contact.avatar.startsWith("data:")) ? (
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  contact.avatar
                )}
              </div>

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
                    "text-sm font-semibold truncate transition-colors",
                    isActive
                      ? "text-white font-bold"
                      : "text-slate-100 group-hover:text-white"
                  )}
                >
                  {contact.name}
                </span>

                <span
                  className={cn(
                    "text-[11px] font-normal shrink-0 ml-2 transition-colors",
                    isActive
                      ? "text-[#FFEFC4] font-medium"
                      : contact.unreadCount > 0
                      ? "text-[#FFEFC4] font-semibold"
                      : "text-slate-400"
                  )}
                >
                  {contact.lastMessage?.timestamp || ""}
                </span>
              </div>

              {/* 3. Last Message Preview with status ticks / reaction emojis */}
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-xs truncate flex items-center gap-1.5 leading-snug transition-colors",
                    isActive ? "text-slate-200" : "text-slate-400 group-hover:text-slate-200"
                  )}
                >
                  {contact.lastMessage?.isSelf && (
                    <span>{renderStatusTicks(contact.lastMessage.status)}</span>
                  )}
                  {renderMediaIcon(contact.lastMessage?.mediaType)}
                  <span className="truncate">
                    {contact.lastMessage?.text || "No messages yet"}
                  </span>
                </p>

                {/* Right badges: Pin / Unread Count */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {contact.isPinned && (
                    <Pin className="w-3.5 h-3.5 text-[#97D7FF] rotate-45" />
                  )}

                  {contact.unreadCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#FFEFC4] text-[#086288] font-bold text-[10px] flex items-center justify-center shadow-md">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
