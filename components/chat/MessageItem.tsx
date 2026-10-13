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
        return <Clock className="w-3 h-3 text-slate-300 animate-spin" />;
      case "sent":
        return <Check className="w-3.5 h-3.5 text-slate-300/80" />;
      case "delivered":
        return <CheckCheck className="w-3.5 h-3.5 text-slate-300/80" />;
      case "read":
        return (
          <CheckCheck className="w-3.5 h-3.5 text-sky-300 drop-shadow-[0_0_4px_rgba(56,189,248,0.5)]" />
        );
      default:
        return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
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
                message.senderColor || "from-[#8E24AA] to-[#0070F3]"
              )}
            >
              {message.senderAvatar}
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300">
              {message.senderName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[70%] md:max-w-[62%] rounded-2xl shadow-lg transition-all",
          message.isSelf
            ? "bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-white rounded-br-xs shadow-[#0070F3]/20"
            : "bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-700/60 backdrop-blur-md shadow-slate-950/40"
        )}
      >
        {/* Sender Name in group / received header */}
        {!message.isSelf && isFirstInGroup && (
          <div className="px-3.5 pt-2 pb-0.5 text-xs font-bold text-[#1DB980] flex items-center gap-1.5">
            <span>{message.senderName}</span>
          </div>
        )}

        {/* Media: Image Card Preview */}
        {message.mediaType === "image" && (
          <div className="p-1.5 pb-0">
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/10 group/img">
              <div className="aspect-video w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1DB980] to-[#0070F3] flex items-center justify-center shadow-lg mb-2">
                  <span className="font-extrabold text-white text-base">S9</span>
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  {message.mediaMeta?.fileName || "Six9Chat Asset Preview"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
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
                    ? "bg-white text-[#0070F3] hover:bg-slate-100"
                    : "bg-[#1DB980] text-slate-900 hover:bg-[#1DB980]/90"
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
                              ? "bg-white"
                              : "bg-white/40"
                            : isPlayed
                            ? "bg-[#1DB980]"
                            : "bg-slate-600",
                          isPlayingAudio && "animate-pulse"
                        )}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] font-medium opacity-85">
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
                  ? "bg-black/15 border-white/20"
                  : "bg-slate-900/60 border-slate-700/60"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {message.mediaMeta?.fileName || "Document.pdf"}
                </p>
                <p className="text-[10px] opacity-75">
                  {message.mediaMeta?.fileSize || "1.4 MB"} • PDF Document
                </p>
              </div>
              <button
                type="button"
                className={cn(
                  "p-2 rounded-lg transition hover:scale-105 active:scale-95",
                  message.isSelf
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-[#1DB980]"
                )}
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
                  ? "bg-black/15 border-white/20"
                  : "bg-slate-900/60 border-slate-700/60"
              )}
            >
              <div className="h-24 bg-gradient-to-r from-emerald-950 to-cyan-950 relative flex items-center justify-center">
                <MapPin className="w-8 h-8 text-rose-500 drop-shadow-md animate-bounce" />
                <span className="absolute bottom-1 right-2 text-[10px] font-mono bg-black/60 px-1.5 py-0.5 rounded text-slate-300">
                  Live Location
                </span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">
                    {message.mediaMeta?.locationName || "San Francisco Headquarters"}
                  </p>
                  <p className="text-[10px] opacity-75">Accurate to 5 meters</p>
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
            message.isSelf ? "text-white/85" : "text-slate-400"
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
                    ? "bg-[#0F172A] border-[#1DB980]/80 text-[#1DB980]"
                    : "bg-[#0F172A] border-slate-700 text-slate-300"
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
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
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
              className="absolute bottom-8 left-0 z-30 flex items-center gap-1 p-1 rounded-full bg-slate-900 border border-slate-700 shadow-2xl backdrop-blur-xl"
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-800 text-sm hover:scale-125 transition-transform"
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
