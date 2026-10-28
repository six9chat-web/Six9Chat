"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCheck,
  Clock,
  Play,
  Pause,
  FileText,
  Download,
  Smile,
  Reply,
  Phone,
  Video,
  ChevronDown,
  Copy,
  Forward,
  CheckSquare,
  Trash2,
} from "lucide-react";
import { ChatMessage, MessageStatus } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface MessageItemProps {
  message: ChatMessage;
  currentUserId?: string;
  isOutgoing?: boolean;
  contactName?: string;
  isFirstInGroup?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: ChatMessage) => void;
  onCopy?: (message: ChatMessage) => void;
  onForward?: (message: ChatMessage) => void;
  onSelect?: (messageId: string) => void;
  onDelete?: (message: ChatMessage) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (messageId: string) => void;
}

export function MessageItem({
  message,
  currentUserId,
  isOutgoing,
  contactName,
  isFirstInGroup = true,
  onReact,
  onReply,
  onCopy,
  onForward,
  onSelect,
  onDelete,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: MessageItemProps) {
  // CHAT BUBBLE SENDER DISCRIMINATION LOGIC
  // If message.sender_id === currentUserId -> isSelf = true (OUTGOING, right-aligned, blue accent)
  // If message.sender_id !== currentUserId -> isSelf = false (INCOMING, left-aligned, dark teal/grey)
  const effectiveUserId = String(currentUserId || "");
  const msgSenderId = String(
    (message as any).sender_id || message.senderId || ""
  );
  const isSelf = isOutgoing !== undefined
    ? isOutgoing
    : effectiveUserId && msgSenderId
    ? msgSenderId === effectiveUserId || msgSenderId === "You"
    : Boolean(message.isSelf);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  // Close context menu when clicking outside
  useClickOutside(menuRef, () => setShowMenu(false), showMenu);

  const handleTouchEnd = () => {
    if (isSelectionMode) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onReply?.(message);
    }
    lastTapRef.current = now;
  };


  const toggleAudioPlay = () => {
    setIsPlayingAudio((prev) => !prev);
  };

  const handleEmojiClick = (emoji: string) => {
    if (onReact) {
      onReact(message.id, emoji);
    }
    setShowReactionPicker(false);
  };

  const renderStatusTicks = (status: MessageStatus) => {
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3 text-[#086288]/80 animate-spin" />;
      case "sent":
        return <Check className="w-3.5 h-3.5 text-[#086288]/80" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-[#086288]/80" />;
      case "read":
        return (
          <CheckCheck className="w-3.5 h-3.5 text-[#086288] font-bold drop-shadow-[0_0_2px_rgba(8,98,136,0.5)]" />
        );
      default:
        return <CheckCheck className="w-3.5 h-3.5 text-[#086288]/70" />;
    }
  };

  const QUICK_EMOJIS = ["🌹", "😂", "❤️", "👍", "🔥", "🙏"];

  // 1. Call Event Card ("Voice call / No answer" or "Video call")
  if (message.mediaType === "call") {
    const isVideo = message.mediaMeta?.callLog?.type === "video";
    const statusText =
      message.mediaMeta?.callLog?.status === "missed"
        ? "Missed"
        : message.mediaMeta?.callLog?.status === "completed"
        ? "Completed"
        : "No answer";

    return (
      <div className="flex justify-end w-full my-1.5 px-2 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative w-64 sm:w-72 rounded-2xl bg-[#086288] border border-[#4D8DBA]/50 p-3 shadow-md text-white select-none transition-all hover:border-[#97D7FF]/40"
        >
          <div className="flex items-center gap-3">
            {/* Phone/Video Icon inside circular badge */}
            <div className="w-9 h-9 rounded-full bg-[#053b53] border border-[#4D8DBA]/40 flex items-center justify-center shrink-0">
              {isVideo ? (
                <Video className="w-4 h-4 text-[#97D7FF]" />
              ) : (
                <Phone className="w-4 h-4 text-white rotate-[135deg]" />
              )}
            </div>

            {/* Call Status Stack */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white tracking-tight">
                {isVideo ? "Video call" : "Voice call"}
              </h4>
              <p className="text-xs text-slate-300 font-medium">
                {statusText}
              </p>
            </div>

            {/* Timestamp at bottom right */}
            <div className="self-end text-[10px] text-slate-300 font-medium whitespace-nowrap pl-2">
              {message.timestamp}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Regular Chat Bubbles (Incoming & Outgoing)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "group relative flex items-end gap-2 w-full my-1 px-2 sm:px-4",
        isSelf ? "justify-end" : "justify-start"
      )}
    >
      {/* Multi-Selection Checkbox (WhatsApp Web style) */}
      {isSelectionMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(message.id);
          }}
          className={cn(
            "self-center p-1 cursor-pointer shrink-0 z-20",
            isSelf ? "order-last ml-1" : "order-first mr-1"
          )}
          title={isSelected ? "Deselect message" : "Select message"}
        >
          <div
            className={cn(
              "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
              isSelected
                ? "bg-[#97D7FF] border-[#97D7FF] text-[#086288]"
                : "border-slate-400 hover:border-[#97D7FF] bg-black/30"
            )}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>
      )}

      {/* Bubble Container:
          - Outgoing (Self): #086288 (Ocean blue accent bubble, right-aligned)
          - Incoming: #053b53 (Dark teal/grey bubble, left-aligned)
          - WhatsApp-style double-click / double-tap to reply
      */}
      <div
        onClick={(e) => {
          if (isSelectionMode) {
            e.stopPropagation();
            onToggleSelect?.(message.id);
          }
        }}
        onDoubleClick={() => {
          if (!isSelectionMode) {
            onReply?.(message);
          }
        }}
        onTouchEnd={handleTouchEnd}
        title={isSelectionMode ? "Click to toggle selection" : "Double-click or double-tap to reply"}
        className={cn(
          "relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl shadow-md transition-all select-text cursor-pointer",
          isSelf
            ? "bg-[#086288] text-white rounded-br-xs border border-[#4D8DBA]/50 shadow-[#086288]/30"
            : "bg-[#053b53] text-white rounded-bl-xs border border-[#4D8DBA]/40 shadow-[#053b53]/40",
          isSelectionMode && isSelected && "ring-2 ring-[#97D7FF] brightness-105"
        )}
      >
        {/* WhatsApp Web Style Hover Chevron Down Trigger & Floating Dropdown */}
        {!isSelectionMode && (
          <div className="absolute top-1.5 right-1.5 z-30">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm",
                "text-slate-300 hover:text-white bg-black/30 hover:bg-black/60 backdrop-blur-xs",
                showMenu
                  ? "opacity-100 ring-1 ring-[#97D7FF]/60 bg-black/70 text-[#97D7FF]"
                  : "opacity-0 group-hover:opacity-100"
              )}
              title="Message options"
              aria-label="Message options"
            >
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* Context Dropdown Menu (Exact 5 Core Actions) */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    "absolute top-7 z-50 min-w-[170px] py-1.5 rounded-xl bg-[#032433] border border-[#4D8DBA]/50 shadow-2xl backdrop-blur-xl text-left text-xs select-none",
                    isSelf ? "right-0" : "right-0 sm:left-0 sm:right-auto"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 1. Reply */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onReply?.(message);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-200 hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer"
                  >
                    <Reply className="w-4 h-4 text-[#97D7FF]" />
                    <span>Reply</span>
                  </button>

                  {/* 2. Copy */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onCopy?.(message);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-200 hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-emerald-300" />
                    <span>Copy</span>
                  </button>

                  {/* 3. Forward */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onForward?.(message);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-200 hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer"
                  >
                    <Forward className="w-4 h-4 text-sky-300" />
                    <span>Forward</span>
                  </button>

                  {/* 4. Select */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onSelect?.(message.id);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-200 hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4 text-amber-300" />
                    <span>Select</span>
                  </button>

                  <div className="h-px my-1 bg-[#4D8DBA]/30" />

                  {/* 5. Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete?.(message);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer font-medium"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sender Name in group chats only (NEVER show static Contact label in 1-on-1 chats) */}
        {!isSelf &&
          isFirstInGroup &&
          message.conversationId?.startsWith("group-") &&
          message.senderName &&
          message.senderName !== "Contact" && (
            <div className="px-3.5 pt-2 pb-0.5 text-xs font-bold text-[#97D7FF] flex items-center gap-1.5">
              <span>{message.senderName}</span>
            </div>
          )}

        {/* WhatsApp-Style Quoted / Reply Preview Box */}
        {message.replyTo && (() => {
          const replySenderId = (message.replyTo as any)?.senderId || (message.replyTo as any)?.sender_id;
          const isReplyToSelf = currentUserId && replySenderId
            ? replySenderId === currentUserId
            : message.replyTo.senderName === "You" || (isSelf && !message.replyTo.senderName);
          const replyAuthor = isReplyToSelf
            ? "You"
            : message.replyTo.senderName && message.replyTo.senderName !== "You"
            ? message.replyTo.senderName
            : contactName || "Contact";

          return (
            <div className="mx-2 mt-2 p-2 rounded-lg bg-black/25 border-l-4 border-[#97D7FF] text-left text-xs select-none">
              <div className="font-bold text-[#97D7FF] text-[11px] truncate">
                {replyAuthor}
              </div>
              <div className="text-slate-200 text-xs truncate max-w-xs mt-0.5 opacity-90">
                {message.replyTo.text || "Media"}
              </div>
            </div>
          );
        })()}

        {/* Media: Image Card */}
        {message.mediaType === "image" && (
          <div className="p-1.5 pb-0">
            <div className="relative rounded-xl overflow-hidden bg-[#032433] border border-black/10">
              <img
                src={message.mediaUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}
                alt="Shared image"
                className="w-full max-h-72 object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Media: Video Card */}
        {message.mediaType === "video" && (
          <div className="p-1.5 pb-0">
            <div className="relative rounded-xl overflow-hidden bg-black max-w-sm">
              <video
                src={message.mediaUrl}
                controls
                className="w-full max-h-72 rounded-xl object-contain"
              />
            </div>
          </div>
        )}

        {/* Media: Document / File Card */}
        {(message.mediaType === "document" || (message.mediaType as string) === "file") && (
          <div className="p-2.5 flex items-center gap-3 bg-[#032433]/70 rounded-xl m-1.5 border border-[#4D8DBA]/35">
            <div className="w-10 h-10 rounded-lg bg-[#086288] flex items-center justify-center text-[#FFEFC4] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-semibold text-white truncate">
                {message.mediaMeta?.fileName || message.text || "Attached Document"}
              </p>
              <p className="text-[10px] text-slate-300">
                {message.mediaMeta?.fileSize || "File"}
              </p>
            </div>
            {message.mediaUrl && (
              <a
                href={message.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={message.mediaMeta?.fileName || "attachment"}
                className="p-1.5 rounded-lg bg-[#4D8DBA]/40 hover:bg-[#97D7FF] hover:text-[#086288] text-white transition shrink-0 cursor-pointer"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {/* Media: Audio Player Waveform */}
        {message.mediaType === "audio" && (
          <div className="p-3 pb-1 flex items-center gap-3">
            <button
              type="button"
              onClick={toggleAudioPlay}
              className="w-9 h-9 rounded-full bg-[#97D7FF] text-[#086288] flex items-center justify-center shrink-0 shadow-md hover:bg-[#b4e3ff] transition cursor-pointer"
            >
              {isPlayingAudio ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-[120px]">
              <div className="flex items-center gap-0.5 h-5">
                {[40, 70, 30, 90, 60, 100, 45, 80, 50, 75, 35, 85, 55].map(
                  (h, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 rounded-full transition-all duration-300",
                        i < 6 ? "bg-[#97D7FF]" : "bg-[#4D8DBA]/50"
                      )}
                      style={{ height: `${h}%` }}
                    />
                  )
                )}
              </div>
              <span className="text-[10px] text-slate-300 mt-1 block">
                {message.mediaMeta?.duration || "0:19"}
              </span>
            </div>
          </div>
        )}

        {/* Text Message Content */}
        {message.text && (
          <div className="px-3.5 pr-7 py-1.5 text-xs sm:text-sm font-normal leading-relaxed break-words whitespace-pre-wrap">
            {message.text}
          </div>
        )}


        {/* Timestamp and Delivery Status Bar (ticks only for outgoing messages) */}
        <div className="flex items-center justify-end gap-1 px-3 pb-1.5 -mt-0.5 text-[10px] font-medium text-slate-300 select-none">
          <span>{message.timestamp}</span>
          {isSelf && renderStatusTicks(message.status)}
        </div>

        {/* Message Reaction Badges (e.g. 🌹, 😂, ❤️) */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-2.5 right-2 flex items-center gap-1 z-10 flex-wrap">
            {message.reactions.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleEmojiClick(r.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs shadow-md transition-all hover:scale-110 cursor-pointer",
                  r.userReacted
                    ? "bg-[#97D7FF] text-[#086288] font-bold border border-white/40 ring-1 ring-[#97D7FF]"
                    : "bg-[#032433] text-white border border-[#4D8DBA]/60"
                )}
                title={`Reaction: ${r.emoji}`}
              >
                <span>{r.emoji}</span>
                {r.count > 1 && (
                  <span className={cn("text-[10px] font-bold", r.userReacted ? "text-[#086288]" : "text-[#FFEFC4]")}>
                    {r.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover Quick Actions Menu (Reaction trigger) */}
      <div
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 relative",
          isSelf ? "order-first" : "order-last"
        )}
      >
        <button
          type="button"
          onClick={() => onReply?.(message)}
          className="p-1 rounded-full hover:bg-[#4D8DBA]/25 text-slate-400 hover:text-[#97D7FF] transition cursor-pointer"
          title="Reply (or double-tap)"
        >
          <Reply className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowReactionPicker((p) => !p)}
          className="p-1 rounded-full hover:bg-[#4D8DBA]/25 text-slate-400 hover:text-white transition cursor-pointer"
          title="React to message"
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* Quick Reaction Popup */}
        <AnimatePresence>
          {showReactionPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-7 left-0 z-30 flex items-center gap-1 p-1 rounded-full bg-[#032433] border border-[#4D8DBA] shadow-2xl backdrop-blur-xl"
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#4D8DBA]/30 text-sm hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
