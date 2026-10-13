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
        return <Clock className="w-3 h-3 text-[#4D8DBA] inline" />;
      case "sent":
        return <Check className="w-3.5 h-3.5 text-[#4D8DBA] inline" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-[#4D8DBA] inline" />;
      case "read":
        return <CheckCheck className="w-3.5 h-3.5 text-[#97D7FF] inline" />;
      default:
        return null;
    }
  };

  const renderMediaIcon = (mediaType?: string) => {
    if (mediaType === "audio") return <Mic className="w-3.5 h-3.5 text-[#97D7FF] inline mr-1" />;
    if (mediaType === "image") return <ImageIcon className="w-3.5 h-3.5 text-[#97D7FF] inline mr-1" />;
    if (mediaType === "document") return <FileText className="w-3.5 h-3.5 text-[#FFEFC4] inline mr-1" />;
    return null;
  };

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300 h-64">
        <Users className="w-10 h-10 stroke-[1.5] text-[#4D8DBA] mb-2" />
        <p className="text-sm font-medium text-slate-200">No conversations found</p>
        <p className="text-xs text-[#97D7FF]/70 mt-1">Try adjusting your search query or filter</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#4D8DBA]/20 overflow-y-auto flex-1 select-none">
      {contacts.map((contact) => {
        const isActive = contact.id === activeContactId;

        return (
          <motion.div
            key={contact.id}
            onClick={() => onSelectContact(contact.id)}
            whileHover={{ backgroundColor: "rgba(77, 141, 186, 0.18)" }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "group relative flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors duration-150",
              isActive
                ? "bg-[#4D8DBA]/25 border-l-4 border-[#97D7FF]"
                : "border-l-4 border-transparent hover:bg-[#4D8DBA]/10"
            )}
          >
            {/* Contact Avatar */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md bg-gradient-to-tr",
                  contact.avatarColor || "from-[#086288] to-[#4D8DBA]"
                )}
              >
                {contact.avatar}
              </div>

              {/* Presence Indicator */}
              {contact.status === "online" && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#97D7FF] ring-2 ring-[#053b53]" />
              )}
              {contact.status === "away" && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#FFEFC4] ring-2 ring-[#053b53]" />
              )}
            </div>

            {/* Conversation Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-sm font-bold truncate",
                    isActive ? "text-[#FFEFC4]" : "text-white group-hover:text-[#FFEFC4]"
                  )}
                >
                  {contact.name}
                </span>

                <span
                  className={cn(
                    "text-[11px] font-medium shrink-0 ml-2",
                    contact.unreadCount > 0 ? "text-[#FFEFC4] font-bold" : "text-[#97D7FF]/70"
                  )}
                >
                  {contact.lastMessage?.timestamp || ""}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-300 truncate flex items-center gap-1.5 leading-snug">
                  {contact.lastMessage?.isSelf && (
                    <span>{renderStatusTicks(contact.lastMessage.status)}</span>
                  )}
                  {renderMediaIcon(contact.lastMessage?.mediaType)}
                  <span className="truncate">{contact.lastMessage?.text || "No messages yet"}</span>
                </p>

                <div className="flex items-center gap-1.5 shrink-0">
                  {contact.isPinned && (
                    <Pin className="w-3.5 h-3.5 text-[#97D7FF] rotate-45" />
                  )}

                  {contact.unreadCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#FFEFC4] text-[#086288] font-black text-[10px] flex items-center justify-center shadow-md">
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
