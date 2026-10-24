"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatContact, ChatMessage, MediaType, MediaMeta, UserProfile } from "@/types/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageItem } from "@/components/chat/MessageItem";
import { ForwardModal } from "@/components/chat/ForwardModal";
import { DeleteMessageModal } from "@/components/chat/DeleteMessageModal";
import {
  ShieldAlert,
  UserPlus,
  Trash2,
  UserMinus,
  Check,
  Loader2,
  X,
  Forward,
} from "lucide-react";

interface ChatWindowProps {
  contact: ChatContact;
  messages: ChatMessage[];
  currentUserId?: string;
  currentUser?: UserProfile;
  allContacts?: ChatContact[];
  isTyping?: boolean;
  onSendMessage: (
    text: string,
    mediaType?: MediaType,
    mediaMeta?: MediaMeta,
    mediaUrl?: string,
    replyTo?: { id: string; senderName: string; text: string },
    targetContactId?: string
  ) => void;
  onDeleteMessage?: (messageId: string, deleteForEveryone: boolean) => void;
  onDeleteMultipleMessages?: (messageIds: string[], deleteForEveryone: boolean) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onBackToSidebar?: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onOpenContactInfo?: () => void;
  onUnblockUser?: (contactId: string) => void;
  onSendChatRequest?: (targetUserId: string) => Promise<void> | void;
  onDeleteConversation?: (contactId: string) => void;
  onRefreshMessages?: (conversationId: string) => void;
}

export function ChatWindow({
  contact,
  messages,
  currentUserId,
  currentUser,
  allContacts = [],
  isTyping = false,
  onSendMessage,
  onDeleteMessage,
  onDeleteMultipleMessages,
  onReactToMessage,
  onBackToSidebar,
  onVoiceCall,
  onVideoCall,
  onOpenContactInfo,
  onUnblockUser,
  onSendChatRequest,
  onDeleteConversation,
  onRefreshMessages,
}: ChatWindowProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; text: string } | null>(null);

  // Multi-message selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  // Forward Modal State
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState<ChatMessage | null>(null);

  // Quick Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(text);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Ensure the chat header and replies display the OTHER USER'S name (test1 if logged in as test2)
  const resolvedContact = useMemo(() => {
    if (currentUserId && contact?.id === currentUserId) {
      const other = allContacts?.find((c) => c.id !== currentUserId);
      if (other) return other;
    }
    return contact;
  }, [contact, currentUserId, allContacts]);

  // 1. Reply Action
  const handleReply = (msg: ChatMessage) => {
    const msgSenderId = msg.senderId || (msg as any).sender_id || "";
    const isMsgFromSelf = currentUserId
      ? msgSenderId === currentUserId
      : Boolean(msg.isSelf);

    const otherName =
      resolvedContact?.name && resolvedContact.name !== "You"
        ? resolvedContact.name
        : msg.senderName && msg.senderName !== "You"
        ? msg.senderName
        : "Contact";

    const senderLabel = isMsgFromSelf ? "You" : otherName;
    const previewText = msg.text || (msg.mediaType ? `[${msg.mediaType.toUpperCase()}]` : "Attachment");

    setReplyingTo({
      id: msg.id,
      senderName: senderLabel,
      text: previewText,
      senderId: msgSenderId,
    } as any);
  };

  // 2. Copy Action
  const handleCopy = (msg: ChatMessage) => {
    const textToCopy = msg.text || (msg.mediaType ? `[${msg.mediaType.toUpperCase()}]` : "");
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
      showToast("Message copied to clipboard");
    }
  };

  // 3. Forward Action
  const handleForward = (msg: ChatMessage) => {
    setForwardingMessage(msg);
    setIsForwardModalOpen(true);
  };

  const handleConfirmForward = (targetContactIds: string[]) => {
    if (forwardingMessage) {
      targetContactIds.forEach((destId) => {
        onSendMessage(
          forwardingMessage.text,
          forwardingMessage.mediaType,
          forwardingMessage.mediaMeta,
          forwardingMessage.mediaUrl,
          undefined,
          destId
        );
      });
      showToast(
        `Message forwarded to ${targetContactIds.length} chat${targetContactIds.length > 1 ? "s" : ""}`
      );
      setForwardingMessage(null);
      setIsForwardModalOpen(false);
    } else if (isSelectionMode && selectedMessageIds.size > 0) {
      const selectedMsgs = messages.filter((m) => selectedMessageIds.has(m.id));
      selectedMsgs.forEach((msg) => {
        targetContactIds.forEach((destId) => {
          onSendMessage(
            msg.text,
            msg.mediaType,
            msg.mediaMeta,
            msg.mediaUrl,
            undefined,
            destId
          );
        });
      });
      showToast(`Forwarded ${selectedMsgs.length} message(s)`);
      setIsSelectionMode(false);
      setSelectedMessageIds(new Set());
      setIsForwardModalOpen(false);
    }
  };

  // 4. Select Action
  const handleSelect = (messageId: string) => {
    setIsSelectionMode(true);
    setSelectedMessageIds(new Set([messageId]));
  };

  const handleToggleSelectMessage = (messageId: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
        if (next.size === 0) {
          setIsSelectionMode(false);
        }
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedMessageIds.size === displayedMessages.length) {
      setSelectedMessageIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedMessageIds(new Set(displayedMessages.map((m) => m.id)));
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  };

  const handleForwardSelected = () => {
    if (selectedMessageIds.size === 0) return;
    setForwardingMessage(null);
    setIsForwardModalOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedMessageIds.size === 0) return;
    setDeletingMessage(null);
    setIsDeleteModalOpen(true);
  };

  // 5. Delete Action
  const handleDelete = (msg: ChatMessage) => {
    setDeletingMessage(msg);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = (deleteForEveryone: boolean) => {
    if (deletingMessage) {
      onDeleteMessage?.(deletingMessage.id, deleteForEveryone);
      showToast(deleteForEveryone ? "Deleted for everyone" : "Deleted for me");
      setDeletingMessage(null);
      setIsDeleteModalOpen(false);
    } else if (isSelectionMode && selectedMessageIds.size > 0) {
      const ids = Array.from(selectedMessageIds);
      onDeleteMultipleMessages?.(ids, deleteForEveryone);
      showToast(`Deleted ${ids.length} message(s)`);
      setIsSelectionMode(false);
      setSelectedMessageIds(new Set());
      setIsDeleteModalOpen(false);
    }
  };

  const deletingIsSelf = useMemo(() => {
    if (deletingMessage) return deletingMessage.isSelf;
    if (isSelectionMode && selectedMessageIds.size > 0) {
      const selected = messages.filter((m) => selectedMessageIds.has(m.id));
      return selected.length > 0 && selected.every((m) => m.isSelf);
    }
    return false;
  }, [deletingMessage, isSelectionMode, selectedMessageIds, messages]);

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

  // Container-only auto-scroll to bottom on message update
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const activeConversationId = contact?.conversationId || contact?.id;

  // Permanent message fetch on conversation select / component mount (Task 1)
  useEffect(() => {
    if (activeConversationId) {
      onRefreshMessages?.(activeConversationId);
    }
  }, [activeConversationId, onRefreshMessages]);

  useEffect(() => {
    setHasSentRequest(false);
    setReplyingTo(null);
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
    setForwardingMessage(null);
    setDeletingMessage(null);
  }, [contact.id]);

  const handleSendRequest = async () => {
    if (!onSendChatRequest) return;
    try {
      setIsSendingRequest(true);
      await onSendChatRequest(contact.id);
      setHasSentRequest(true);
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col bg-[#053b53] relative overflow-hidden">
      {/* 1. Top Bar: WhatsApp Selection Action Bar or Regular ChatHeader */}
      {isSelectionMode ? (
        <div className="h-16 px-4 bg-[#032433] border-b border-[#4D8DBA]/40 flex items-center justify-between shrink-0 z-30 select-none shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={exitSelectionMode}
              className="p-2 rounded-full hover:bg-[#4D8DBA]/25 text-slate-300 hover:text-white transition cursor-pointer"
              title="Close selection"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-white tracking-tight">
              {selectedMessageIds.size} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#97D7FF] hover:bg-[#4D8DBA]/20 transition cursor-pointer"
            >
              {selectedMessageIds.size === displayedMessages.length ? "Deselect All" : "Select All"}
            </button>

            <button
              type="button"
              disabled={selectedMessageIds.size === 0}
              onClick={handleForwardSelected}
              className="p-2 rounded-xl hover:bg-[#4D8DBA]/25 text-slate-200 hover:text-sky-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Forward selected"
            >
              <Forward className="w-5 h-5" />
            </button>

            <button
              type="button"
              disabled={selectedMessageIds.size === 0}
              onClick={handleDeleteSelected}
              className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Delete selected"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <ChatHeader
          contact={resolvedContact}
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
      )}

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
              width="140"
              height="140"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M20 20 c0-5 5-10 12-10 c8 0 14 6 14 13 c0 6-4 10-9 12 l-3 1 l0 4 l-6 0 l0-6 l6-2 c3-1 6-4 6-9 c0-4-3-7-8-7 c-4 0-7 3-7 6 z M29 45 a2.5 2.5 0 1 0 0.01 0 z"
                fill="currentColor"
              />
              <path
                d="M75 18 h16 v16 h-16 z M83 14 v4 M83 34 v4 M71 26 h4 M91 26 h4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M58 52 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z"
                fill="currentColor"
                opacity="0.8"
              />
              <path
                d="M102 102 c-2 -3 -6 -3 -8 0 c-2 3 0 6 4 9 l4 4 l4 -4 c4 -3 6 -6 4 -9 c-2 -3 -6 -3 -8 0 z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
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

      {/* 3. Scrollable Messages Stream */}
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

            {/* Message Items with Chevron Dropdown, Copy, Forward, Select, Delete */}
            {group.items.map((msg, index) => {
              const prevMsg = group.items[index - 1];
              const prevSender = prevMsg ? (prevMsg.senderId || (prevMsg as any).sender_id) : "";
              const msgSenderId = msg.senderId || (msg as any).sender_id || "";
              const isFirstInGroup = !prevMsg || prevSender !== msgSenderId;

              // CHAT BUBBLE SENDER DISCRIMINATION LOGIC
              // Compare each message's sender_id with currentUserId:
              // IF message.sender_id === currentUserId -> OUTGOING (Right-aligned, blue accent)
              // IF message.sender_id !== currentUserId -> INCOMING (Left-aligned, contrasting dark teal/grey)
              const isOutgoing = currentUserId
                ? msgSenderId === currentUserId
                : Boolean(msg.isSelf);

              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  currentUserId={currentUserId}
                  isOutgoing={isOutgoing}
                  contactName={resolvedContact?.name}
                  isFirstInGroup={isFirstInGroup}
                  onReact={onReactToMessage}
                  onReply={handleReply}
                  onCopy={handleCopy}
                  onForward={handleForward}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedMessageIds.has(msg.id)}
                  onToggleSelect={handleToggleSelectMessage}
                />
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-[#97D7FF] font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#97D7FF] animate-bounce" />
            <span>{(resolvedContact || contact).name} is typing...</span>
          </div>
        )}
      </div>

      {/* 4. Bottom Input Dock or Action Footers */}
      {(resolvedContact || contact).isBlocked ? (
        <div className="p-4 bg-[#032433]/95 border-t border-[#4D8DBA]/35 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left z-20 shrink-0 select-none">
          <div className="flex items-center gap-2.5 text-xs text-rose-300 font-semibold">
            <span className="p-1.5 rounded-full bg-rose-500/20 text-rose-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span>{(resolvedContact || contact).name} is blocked</span>
          </div>
          {onUnblockUser && (
            <button
              type="button"
              onClick={() => onUnblockUser((resolvedContact || contact).id)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] text-[#086288] font-bold text-xs hover:brightness-105 active:scale-95 transition cursor-pointer shadow-md shadow-[#086288]/40"
            >
              Unblock
            </button>
          )}
        </div>
      ) : contact.isUnfriended ? (
        <div className="p-4 bg-[#032433]/95 border-t border-[#4D8DBA]/35 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left z-20 shrink-0 select-none">
          <div className="flex items-center gap-2.5 text-xs text-amber-200 font-medium">
            <span className="p-1.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
              <UserMinus className="w-4 h-4" />
            </span>
            <span>
              You unfriended <strong className="text-white">{contact.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasSentRequest ? (
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                Request Sent
              </span>
            ) : (
              <button
                type="button"
                disabled={isSendingRequest}
                onClick={handleSendRequest}
                className="px-3.5 py-1.5 rounded-xl bg-[#4D8DBA] hover:bg-[#97D7FF] text-white hover:text-[#053b53] font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#086288]/40 active:scale-95"
              >
                {isSendingRequest ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                + Add Again
              </button>
            )}
            {onDeleteConversation && (
              <button
                type="button"
                onClick={() => onDeleteConversation(contact.id)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 border border-rose-500/30 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Conversation
              </button>
            )}
          </div>
        </div>
      ) : (resolvedContact || contact).isUnfriendedByPartner ? (
        <div className="p-4 bg-[#032433]/95 border-t border-[#4D8DBA]/35 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left z-20 shrink-0 select-none">
          <div className="flex items-center gap-2.5 text-xs text-amber-200 font-medium">
            <span className="p-1.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
              <UserMinus className="w-4 h-4" />
            </span>
            <span>
              <strong className="text-white">{(resolvedContact || contact).name}</strong> unfriended you. Send request to reconnect?
            </span>
          </div>
          <div className="shrink-0">
            {hasSentRequest ? (
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                Request Sent
              </span>
            ) : (
              <button
                type="button"
                disabled={isSendingRequest}
                onClick={handleSendRequest}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] text-[#053b53] font-bold text-xs hover:brightness-105 active:scale-95 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#086288]/40"
              >
                {isSendingRequest ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Send Request
              </button>
            )}
          </div>
        </div>
      ) : (
        <ChatInput
          onSendMessage={onSendMessage}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      )}

      {/* 5. Modals & Notifications */}
      {/* Forward Modal */}
      <ForwardModal
        isOpen={isForwardModalOpen}
        contacts={allContacts}
        onClose={() => {
          setIsForwardModalOpen(false);
          setForwardingMessage(null);
        }}
        onConfirmForward={handleConfirmForward}
        messageToForward={forwardingMessage}
        selectedCount={forwardingMessage ? 1 : selectedMessageIds.size}
      />

      {/* Delete Confirmation Modal */}
      <DeleteMessageModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingMessage(null);
        }}
        onConfirmDelete={handleConfirmDelete}
        isSelfSender={deletingIsSelf}
        count={deletingMessage ? 1 : selectedMessageIds.size}
      />

      {/* Toast Notification Pill */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#032433]/95 border border-[#4D8DBA]/60 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 select-none pointer-events-none"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
