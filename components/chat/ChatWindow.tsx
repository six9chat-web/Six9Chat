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
  onOpenContactInfo?: () => void;
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
  onOpenContactInfo,
}: ChatWindowProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Filter messages if search is active
  const displayedMessages = useMemo(() => {
    if (!chatSearchQuery.trim()) return messages;
    return messages.filter((m) =>
      m.text.toLowerCase().includes(chatSearchQuery.toLowerCase())
    );
  }, [messages, chatSearchQuery]);

  // Group messages by date (e.g. Monday, Yesterday, Today)
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

  // STRICT CONTAINER-ONLY AUTO-SCROLL:
  // Using scrollTop on messagesContainerRef directly prevents window/body scrolling
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Ensure window is strictly anchored to (0, 0)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col bg-[#053b53] relative overflow-hidden">
      {/* 1. Top Chat Header Bar (Always pinned at top, shrink-0) */}
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
        onOpenContactInfo={onOpenContactInfo}
      />

      {/* 2. WhatsApp Subtle Doodle Wallpaper Pattern Background */}
      <div className="absolute inset-0 top-16 bottom-16 pointer-events-none opacity-[0.07] overflow-hidden select-none">
        <svg
          className="w-full h-full text-[#97D7FF]"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="whatsappDoodlePattern"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              {/* Coffee Cup Doodle */}
              <path
                d="M15 25 h20 v12 c0 4 -3 8 -10 8 s-10 -4 -10 -8 z M35 28 h4 c3 0 4 2 4 4 s-1 4 -4 4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Speech Bubble Doodle */}
              <path
                d="M75 18 h24 c3 0 6 3 6 6 v10 c0 3 -3 6 -6 6 h-12 l-6 5 v-5 h-6 c-3 0 -6 -3 -6 -6 v-10 c0 -3 3 -6 6 -6 z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Smile Face Doodle */}
              <circle
                cx="30"
                cy="85"
                r="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle cx="26" cy="82" r="1.5" fill="currentColor" />
              <circle cx="34" cy="82" r="1.5" fill="currentColor" />
              <path
                d="M26 89 q4 4 8 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Headphones / Clock Doodle */}
              <circle
                cx="85"
                cy="75"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M85 69 v6 h4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Sparkle / Star Doodle */}
              <path
                d="M58 52 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z"
                fill="currentColor"
                opacity="0.8"
              />
              {/* Heart Doodle */}
              <path
                d="M102 102 c-2 -3 -6 -3 -8 0 c-2 3 0 6 4 9 l4 4 l4 -4 c4 -3 6 -6 4 -9 c-2 -3 -6 -3 -8 0 z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              {/* Music Note Doodle */}
              <path
                d="M18 58 v10 c-1 -1 -3 -1 -4 0 c-2 1 -2 3 0 4 c2 1 4 0 4 -2 v-9 h6 v5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#whatsappDoodlePattern)" />
        </svg>
      </div>

      {/* 3. Scrollable Messages Stream (min-h-0 guarantees correct flexbox scroll) */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 py-3 space-y-2.5 z-10"
      >
        {groupedMessages.map((group) => (
          <div key={group.date} className="space-y-1">
            {/* Centered Date Separator Pill ("Monday", "Yesterday", "Today") */}
            <div className="flex justify-center my-3.5">
              <span className="px-3.5 py-1 rounded-lg bg-[#086288]/85 border border-[#4D8DBA]/35 text-[11px] font-semibold text-slate-200 shadow-sm">
                {group.date}
              </span>
            </div>

            {/* Message Items in this date group */}
            {group.items.map((msg, index) => {
              const prevMsg = group.items[index - 1];
              const isFirstInGroup =
                !prevMsg || prevMsg.senderId !== msg.senderId;

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

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-[#97D7FF] font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#97D7FF] animate-bounce" />
            <span>{contact.name} is typing...</span>
          </div>
        )}
      </div>

      {/* 4. Bottom Input Dock (Always pinned at bottom, shrink-0) */}
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
}
