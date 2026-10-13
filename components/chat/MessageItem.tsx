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
  MoreVertical,
  Volume2,
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
  const [audioProgress, setAudioProgress] = useState(35);

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

  const QUICK_EMOJIS = ["👍", "❤️", "🔥", "😂", "⚡", "🙌"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group relative flex items-end gap-2 w-full my-1.5 px-2 sm:px-4",
        message.isSelf ? "justify-end" : "justify-start"
      )}
    >
      {/* Contact Avatar for received messages */}
      {!message.isSelf && (
        <div className="shrink-0 mb-1">
          {message.senderAvatar ? (
            <div
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-md bg-gradient-to-tr",
                message.senderColor || "from-[#086288] to-[#4D8DBA]"
              )}
            >
              {message.senderAvatar}
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#086288] flex items-center justify-center text-xs text-[#97D7FF] font-semibold border border-[#4D8DBA]/50">
              {message.senderName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Bubble Container:
          - Sent: #97D7FF with dark readable text #05364b
          - Received: #FFEFC4 with dark readable text #2b2106
      */}
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[70%] md:max-w-[62%] rounded-2xl shadow-md transition-all",
          message.isSelf
            ? "bg-[#97D7FF] text-[#05364b] rounded-br-xs border border-[#80c8f8] shadow-[#086288]/15"
            : "bg-[#FFEFC4] text-[#2b2106] rounded-bl-xs border border-[#f5dfa6] shadow-[#086288]/15"
        )}
      >
        {/* Sender Name in group / received header */}
        {!message.isSelf && isFirstInGroup && (
          <div className="px-3.5 pt-2 pb-0.5 text-xs font-bold text-[#086288] flex items-center gap-1.5">
            <span>{message.senderName}</span>
          </div>
        )}

        {/* Media: Image Card Preview */}
        {message.mediaType === "image" && (
          <div className="p-1.5 pb-0">
            <div className="relative rounded-xl overflow-hidden bg-[#086288] border border-black/10 group/img">
              <div className="aspect-video w-full bg-gradient-to-br from-[#086288] via-[#053b53] to-[#032535] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4D8DBA] to-[#97D7FF] flex items-center justify-center shadow-lg mb-2">
                  <span className="font-extrabold text-[#086288] text-base">S9</span>
                </div>
                <span className="text-xs font-semibold text-[#97D7FF]">
                  {message.mediaMeta?.fileName || "Six9Chat Asset Preview"}
                </span>
                <span className="text-[10px] text-slate-300 mt-0.5">
                  {message.mediaMeta?.fileSize || "680 KB PNG"} • High Resolution
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Media: Voice Note Audio Card */}
        {message.mediaType === "audio" && (
          <div className="p-3 sm:p-3.5 pb-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleAudioPlay}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95",
                  message.isSelf
                    ? "bg-[#086288] text-[#97D7FF] hover:bg-[#064866]"
                    : "bg-[#086288] text-[#FFEFC4] hover:bg-[#064866]"
                )}
                aria-label={isPlayingAudio ? "Pause voice note" : "Play voice note"}
              >
                {isPlayingAudio ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Dynamic Waveform Simulation */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-0.5 sm:gap-1 h-7">
                  {[
                    14, 22, 10, 28, 36, 18, 26, 40, 24, 12, 32, 20, 38, 28, 16, 30,
                    22, 12, 26, 18, 34, 24, 16, 28,
                  ].map((height, i) => {
                    const isPlayed = (i / 24) * 100 <= audioProgress;
                    return (
                      <span
                        key={i}
                        style={{ height: `${height}px` }}
                        className={cn(
                          "w-1 rounded-full transition-all duration-150",
                          message.isSelf
                            ? isPlayed
                              ? "bg-[#086288]"
                              : "bg-[#086288]/30"
                            : isPlayed
                            ? "bg-[#086288]"
                            : "bg-[#70591f]/35",
                          isPlayingAudio && "animate-pulse"
                        )}
                      />
                    );
                  })}
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between text-[10px] font-medium",
                    message.isSelf ? "text-[#086288]/80" : "text-[#70591f]"
                  )}
                >
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>{message.mediaMeta?.duration || "0:28"}</span>
                  </span>
                  <span>Voice Note</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media: Document File Card */}
        {message.mediaType === "document" && (
          <div className="p-3 pb-2">
            <div
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-xl border backdrop-blur-sm",
                message.isSelf
                  ? "bg-[#086288]/10 border-[#086288]/25"
                  : "bg-[#086288]/10 border-[#70591f]/25"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-[#086288]/20 border border-[#086288]/30 flex items-center justify-center text-[#086288] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {message.mediaMeta?.fileName || "Document.pdf"}
                </p>
                <p
                  className={cn(
                    "text-[10px]",
                    message.isSelf ? "text-[#086288]/75" : "text-[#70591f]"
                  )}
                >
                  {message.mediaMeta?.fileSize || "1.4 MB"} • PDF Document
                </p>
              </div>
              <button
                type="button"
                className="p-2 rounded-lg transition hover:scale-105 active:scale-95 bg-[#086288] text-[#97D7FF] hover:bg-[#064866]"
                title="Download Attachment"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Media: Location Card */}
        {message.mediaType === "location" && (
          <div className="p-3 pb-2">
            <div
              className={cn(
                "rounded-xl overflow-hidden border",
                message.isSelf
                  ? "bg-[#086288]/10 border-[#086288]/25"
                  : "bg-[#086288]/10 border-[#70591f]/25"
              )}
            >
              <div className="h-24 bg-gradient-to-r from-[#086288] to-[#4D8DBA] relative flex items-center justify-center">
                <MapPin className="w-8 h-8 text-[#FFEFC4] drop-shadow-md animate-bounce" />
                <span className="absolute bottom-1 right-2 text-[10px] font-mono bg-black/60 px-1.5 py-0.5 rounded text-white">
                  Live Location
                </span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">
                    {message.mediaMeta?.locationName || "San Francisco Headquarters"}
                  </p>
                  <p
                    className={cn(
                      "text-[10px]",
                      message.isSelf ? "text-[#086288]/75" : "text-[#70591f]"
                    )}
                  >
                    Accurate to 5 meters
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </div>
            </div>
          </div>
        )}

        {/* Text Message Content */}
        {message.text && (
          <div className="px-3.5 py-2 text-xs sm:text-sm font-normal leading-relaxed break-words whitespace-pre-wrap">
            {message.text}
          </div>
        )}

        {/* Timestamp and Delivery Status Bar */}
        <div
          className={cn(
            "flex items-center justify-end gap-1.5 px-3 pb-1.5 -mt-1 text-[10px] font-medium select-none",
            message.isSelf ? "text-[#086288]/85" : "text-[#70591f]"
          )}
        >
          <span>{message.timestamp}</span>
          {message.isSelf && renderStatusTicks(message.status)}
        </div>

        {/* Reaction Badges on Bubble Footer */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-2.5 right-3 flex items-center gap-1 z-10">
            {message.reactions.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleEmojiClick(r.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium shadow-md border transition-transform hover:scale-110",
                  r.userReacted
                    ? "bg-[#086288] border-[#4D8DBA] text-[#FFEFC4]"
                    : "bg-[#053b53] border-[#4D8DBA]/60 text-slate-200"
                )}
              >
                <span>{r.emoji}</span>
                {r.count > 1 && <span className="text-[10px]">{r.count}</span>}
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
          className="p-1.5 rounded-full hover:bg-[#4D8DBA]/20 text-slate-300 hover:text-white transition"
          title="React to message"
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* Quick Reaction Popup */}
        <AnimatePresence>
          {showReactionPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-8 left-0 z-30 flex items-center gap-1 p-1 rounded-full bg-[#086288] border border-[#4D8DBA] shadow-2xl backdrop-blur-xl"
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#4D8DBA]/30 text-sm hover:scale-125 transition-transform"
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
