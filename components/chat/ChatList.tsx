"use client";

import React from "react";
import { motion } from "framer-motion";
import { Pin, CheckCheck, Check, Clock, Mic, Image as ImageIcon, FileText, Users } from "lucide-react";
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
        return <Clock className="w-3 h-3 text-slate-400 inline" />;
      case "sent":
        return <Check className="w-3 h-3 text-slate-400 inline" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-slate-400 inline" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-sky-400 inline" />;
      default:
        return null;
    }
  };

  const renderMediaIcon = (mediaType?: string) => {
    if (mediaType === "audio") return <Mic className="w-3.5 h-3.5 text-[#1DB980] inline mr-1" />;
    if (mediaType === "image") return <ImageIcon className="w-3.5 h-3.5 text-cyan-400 inline mr-1" />;
    if (mediaType === "document") return <FileText className="w-3.5 h-3.5 text-rose-400 inline mr-1" />;
    return null;
  };

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 h-64">
        <Users className="w-10 h-10 stroke-[1.5] text-slate-600 mb-2" />
        <p className="text-sm font-medium text-slate-400">No conversations found</p>
        <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filter</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800/40 overflow-y-auto flex-1 select-none">
      {contacts.map((contact) => {
        const isActive = contact.id === activeContactId;

        return (
          <motion.div
            key={contact.id}
            onClick={() => onSelectContact(contact.id)}
            whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.45)" }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "group relative flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors duration-150",
              isActive
                ? "bg-slate-800/70 border-l-4 border-[#1DB980]"
                : "border-l-4 border-transparent hover:bg-slate-800/30"
            )}
          >
            {/* Contact Avatar */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md bg-gradient-to-tr",
                  contact.avatarColor || "from-[#1DB980] to-[#0070F3]"
                )}
              >
                {contact.avatar}
              </div>

              {/* Presence Indicator */}
              {contact.status === "online" && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#1DB980] ring-2 ring-[#0F172A]" />
              )}
              {contact.status === "away" && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-[#0F172A]" />
              )}
            </div>

            {/* Conversation Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-sm font-bold truncate",
                    isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                  )}
                >
                  {contact.name}
                </span>

                <span
                  className={cn(
                    "text-[11px] font-medium shrink-0 ml-2",
                    contact.unreadCount > 0 ? "text-[#1DB980]" : "text-slate-500"
                  )}
                >
                  {contact.lastMessage?.timestamp || ""}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 leading-snug">
                  {contact.lastMessage?.isSelf && (
                    <span>{renderStatusTicks(contact.lastMessage.status)}</span>
                  )}
                  {renderMediaIcon(contact.lastMessage?.mediaType)}
                  <span className="truncate">{contact.lastMessage?.text || "No messages yet"}</span>
                </p>

                <div className="flex items-center gap-1.5 shrink-0">
                  {contact.isPinned && (
                    <Pin className="w-3.5 h-3.5 text-slate-500 rotate-45" />
                  )}

                  {contact.unreadCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-white font-extrabold text-[10px] flex items-center justify-center shadow-md shadow-[#1DB980]/20">
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
