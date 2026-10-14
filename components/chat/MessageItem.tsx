"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCheck,
  Clock,
  Play,
  Pause,
  FileText,
  Download,
  MapPin,
  ExternalLink,
  Smile,
  Phone,
  PhoneMissed,
  Video,
} from "lucide-react";
import { ChatMessage, MessageStatus } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: ChatMessage;
  isFirstInGroup?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
}

export function MessageItem({
  message,
  isFirstInGroup = true,
  onReact,
}: MessageItemProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

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
        "group relative flex items-end gap-1.5 w-full my-1 px-2 sm:px-4",
        message.isSelf ? "justify-end" : "justify-start"
      )}
    >
      {/* Bubble Container:
          - Outgoing (Self): #086288 or #97D7FF (Ocean blue accent bubble)
          - Incoming: #053b53 or #FFEFC4 (Dark slate/cream bubble)
      */}
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl shadow-md transition-all",
          message.isSelf
            ? "bg-[#086288] text-white rounded-br-xs border border-[#4D8DBA]/50 shadow-[#086288]/30"
            : "bg-[#053b53] text-white rounded-bl-xs border border-[#4D8DBA]/40 shadow-[#053b53]/40"
        )}
      >
        {/* Sender Name in group */}
        {!message.isSelf && isFirstInGroup && (
          <div className="px-3.5 pt-2 pb-0.5 text-xs font-bold text-[#97D7FF] flex items-center gap-1.5">
            <span>{message.senderName}</span>
          </div>
        )}

        {/* Media: Image Card */}
        {message.mediaType === "image" && (
          <div className="p-1.5 pb-0">
            <div className="relative rounded-xl overflow-hidden bg-[#032433] border border-black/10">
              <img
                src={message.mediaUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}
                alt="Shared media"
                className="w-full max-h-72 object-cover"
              />
            </div>
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
          <div className="px-3.5 py-1.5 text-xs sm:text-sm font-normal leading-relaxed break-words whitespace-pre-wrap">
            {message.text}
          </div>
        )}

        {/* Timestamp and Delivery Status Bar */}
        <div className="flex items-center justify-end gap-1 px-3 pb-1.5 -mt-0.5 text-[10px] font-medium text-slate-300 select-none">
          <span>{message.timestamp}</span>
          {message.isSelf && renderStatusTicks(message.status)}
        </div>

        {/* Message Reaction Badges (e.g. 🌹, 😂) */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-2.5 right-2 flex items-center gap-1 z-10">
            {message.reactions.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleEmojiClick(r.emoji)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-[#032433] border border-[#4D8DBA]/60 shadow-md text-white transition-transform hover:scale-110 cursor-pointer"
              >
                <span>{r.emoji}</span>
                {r.count > 1 && (
                  <span className="text-[10px] font-bold text-[#FFEFC4]">
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
          message.isSelf ? "order-first" : "order-last"
        )}
      >
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
