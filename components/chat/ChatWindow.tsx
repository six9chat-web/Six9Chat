"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatContact, ChatMessage, MediaType, MediaMeta } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageItem } from "@/components/chat/MessageItem";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  contact: ChatContact;
  messages: ChatMessage[];
  isTyping?: boolean;
  onSendMessage: (
    text: string,
    mediaType?: MediaType,
    mediaMeta?: MediaMeta,
    mediaUrl?: string
  ) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onBackToSidebar?: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}

export function ChatWindow({
  contact,
  messages,
  isTyping = false,
  onSendMessage,
  onReactToMessage,
  onBackToSidebar,
  onVoiceCall,
  onVideoCall,
}: ChatWindowProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages if search is active
  const displayedMessages = useMemo(() => {
    if (!chatSearchQuery.trim()) return messages;
    return messages.filter((m) =>
      m.text.toLowerCase().includes(chatSearchQuery.toLowerCase())
    );
  }, [messages, chatSearchQuery]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: ChatMessage[] }[] = [];
    displayedMessages.forEach((msg) => {
      const existing = groups.find((g) => g.date === msg.date);
      if (existing) {
        existing.items.push(msg);
      } else {
        groups.push({ date: msg.date, items: [msg] });
      }
    });
    return groups;
  }, [displayedMessages]);

  // Auto-scroll to bottom when messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 h-full flex flex-col bg-[#053b53] relative overflow-hidden">
      {/* Top Header */}
      <ChatHeader
        contact={contact}
        isTyping={isTyping}
        onBackToSidebar={onBackToSidebar}
        onVoiceCall={onVoiceCall}
        onVideoCall={onVideoCall}
        onToggleSearchInChat={() => {
          setIsSearchOpen((prev) => !prev);
          if (isSearchOpen) setChatSearchQuery("");
        }}
        isSearchOpen={isSearchOpen}
        searchQuery={chatSearchQuery}
        onSearchChange={setChatSearchQuery}
      />

      {/* Six9 Chat Subtle Wallpaper Pattern & Ambient Background */}
      <div className="absolute inset-0 top-16 bottom-16 pointer-events-none opacity-20">
        <svg
          className="w-full h-full text-[#4D8DBA]"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="chatPattern"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="30" cy="30" r="1.5" fill="currentColor" opacity="0.3" />
              <path
                d="M10 20 Q 20 10 30 20 T 50 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
                opacity="0.2"
              />
              <path
                d="M15 45 L 25 45 L 20 38 Z"
                fill="currentColor"
                opacity="0.18"
              />
              <circle cx="45" cy="45" r="3" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#chatPattern)" />
        </svg>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-3 z-10">


        {groupedMessages.map((group) => (
          <div key={group.date} className="space-y-1.5">
            {/* Date Divider Pill */}
            <div className="flex justify-center my-3">
              <span className="px-3 py-1 rounded-lg bg-[#086288]/90 border border-[#4D8DBA]/40 text-[11px] font-semibold text-[#97D7FF] shadow-sm uppercase tracking-wider">
                {group.date}
              </span>
            </div>

            {/* Message Items in this date group */}
            {group.items.map((msg, index) => {
              const prevMsg = group.items[index - 1];
              const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isFirstInGroup={isFirstInGroup}
                  onReact={onReactToMessage}
                />
              );
            })}
          </div>
        ))}

        {/* Real-Time Typing Indicator (Six9 Chat Style Three Dots) */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 pl-3 sm:pl-4 my-2"
            >
              <div className="w-7 h-7 rounded-full bg-[#086288] border border-[#4D8DBA]/50 flex items-center justify-center text-[10px] font-bold text-[#97D7FF]">
                {contact.avatar}
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-[#086288] border border-[#4D8DBA]/40 rounded-tl-xs flex items-center gap-1.5 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#97D7FF] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4D8DBA] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFEFC4] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-[#97D7FF]/80 ml-1 italic">typing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Anchor element for smooth auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Bar */}
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
}
