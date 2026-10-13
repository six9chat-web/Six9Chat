"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  FileText,
  MapPin,
  X,
  Radio,
  Check,
  StopCircle,
} from "lucide-react";
import { MediaType, MediaMeta } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (
    text: string,
    mediaType?: MediaType,
    mediaMeta?: MediaMeta,
    mediaUrl?: string
  ) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [text]);

  // Voice recording timer simulation
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim(), "text");
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendVoiceNote = () => {
    const mins = Math.floor(recordingSeconds / 60);
    const secs = recordingSeconds % 60;
    const duration = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

    setIsRecording(false);
    onSendMessage("", "audio", {
      fileName: `Voice note #${Math.floor(Math.random() * 900) + 100}`,
      duration: duration === "0:00" ? "0:04" : duration,
    });
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendAttachment = (type: MediaType) => {
    setShowAttachMenu(false);
    if (type === "image") {
      onSendMessage(
        "Attached UI asset mockup",
        "image",
        {
          fileName: "six9_mockup_design.png",
          fileSize: "1.2 MB",
        }
      );
    } else if (type === "document") {
      onSendMessage(
        "Attached document file",
        "document",
        {
          fileName: "Six9_Project_Specs.pdf",
          fileSize: "2.4 MB",
        }
      );
    } else if (type === "location") {
      onSendMessage(
        "",
        "location",
        {
          locationName: "Silicon Valley Innovation Hub, CA",
        }
      );
    }
  };

  const EMOJI_LIST = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "😍", "🥰", "😘", "😎", "🤩", "🥳", "🤔", "🤫", "🤭", "🫡",
    "👍", "👎", "👏", "🙌", "🤝", "🔥", "⚡", "✨", "💯", "🚀",
    "🎉", "🏆", "❤️", "🧡", "💛", "💚", "💙", "💜", "💡", "☕",
  ];

  return (
    <div className="relative p-2.5 sm:p-4 bg-[#086288] border-t border-[#4D8DBA]/35 backdrop-blur-xl z-20 shrink-0 select-none">
      {/* Attachment Submenu Popover */}
      <AnimatePresence>
        {showAttachMenu && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowAttachMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-6 bottom-20 z-40 bg-[#086288] border border-[#4D8DBA]/60 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl flex flex-col gap-1 min-w-[200px]"
            >
              <button
                type="button"
                onClick={() => sendAttachment("image")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-100 hover:bg-[#4D8DBA]/30 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-[#97D7FF]/20 text-[#97D7FF] flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span>Photos & Videos</span>
              </button>

              <button
                type="button"
                onClick={() => sendAttachment("document")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-100 hover:bg-[#4D8DBA]/30 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFEFC4]/20 text-[#FFEFC4] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Documents & PDF</span>
              </button>

              <button
                type="button"
                onClick={() => sendAttachment("location")}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-100 hover:bg-[#4D8DBA]/30 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-[#4D8DBA]/30 text-[#97D7FF] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>Share Location</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Emoji Picker Popover */}
      <AnimatePresence>
        {showEmojiPicker && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowEmojiPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-4 bottom-20 z-40 bg-[#086288] border border-[#4D8DBA]/60 rounded-2xl p-3 shadow-2xl backdrop-blur-xl max-w-xs sm:max-w-sm"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#4D8DBA]/40 text-xs font-bold text-[#FFEFC4]">
                <span>Emojis & Reactions</span>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-slate-300 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setText((prev) => prev + emoji);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#4D8DBA]/30 text-base hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Live Voice Recording UI Bar */}
      {isRecording ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between gap-3 bg-[#053b53] border border-[#4D8DBA]/50 rounded-2xl p-2.5 px-4 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-[#FFEFC4]">
              Recording{" "}
              {`${Math.floor(recordingSeconds / 60)}:${
                recordingSeconds % 60 < 10 ? "0" : ""
              }${recordingSeconds % 60}`}
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Speak into your microphone...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#4D8DBA]/30 text-xs font-semibold flex items-center gap-1 transition"
            >
              <X className="w-4 h-4 text-rose-300" />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={handleSendVoiceNote}
              className="p-2 px-3 rounded-xl bg-[#97D7FF] text-[#086288] text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-[#b4e3ff] transition"
            >
              <Check className="w-4 h-4" />
              <span>Send Note</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* Regular Input Bar */
        <div className="flex items-end gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((p) => !p)}
            className="p-2 sm:p-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-[#4D8DBA]/25 transition shrink-0"
            title="Emoji selector"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment Toggle */}
          <button
            type="button"
            onClick={() => setShowAttachMenu((p) => !p)}
            className="p-2 sm:p-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-[#4D8DBA]/25 transition shrink-0"
            title="Attach Media or File"
          >
            <Paperclip className="w-5 h-5 rotate-45" />
          </button>

          {/* Auto-expanding Input Box */}
          <div className="flex-1 bg-[#053b53] border border-[#4D8DBA]/40 rounded-2xl focus-within:border-[#97D7FF] focus-within:ring-1 focus-within:ring-[#97D7FF]/50 transition-all px-3 py-1.5 flex items-center">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Type a message..."
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-300 outline-none resize-none max-h-36 leading-normal my-1"
            />
          </div>

          {/* Dynamic Mic / Send Action */}
          {text.trim().length > 0 ? (
            <motion.button
              type="button"
              onClick={handleSend}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 sm:p-3 rounded-2xl bg-[#97D7FF] text-[#086288] font-bold shadow-lg shadow-[#086288]/40 hover:bg-[#b4e3ff] transition shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={() => setIsRecording(true)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 sm:p-3 rounded-2xl bg-[#053b53] hover:bg-[#4D8DBA]/30 text-[#97D7FF] transition shrink-0 border border-[#4D8DBA]/40"
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
