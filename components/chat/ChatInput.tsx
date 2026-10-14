"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Plus,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  FileText,
  MapPin,
  X,
  Check,
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
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
      duration: duration === "0:00" ? "0:19" : duration,
    });
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleImagePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onSendMessage("Media attachment", "image", {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      }, reader.result as string);
    };
    reader.readAsDataURL(file);
    setShowAttachMenu(false);
  };

  const handleDocPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onSendMessage(file.name, "document", {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
    });
    setShowAttachMenu(false);
  };

  const EMOJI_LIST = [
    "🌹", "😂", "😅", "❤️", "👍", "🔥", "🙏", "😍", "🎉", "✨",
    "😊", "🙌", "💯", "😎", "🥳", "🤔", "👏", "⚡", "🌟", "👌"
  ];

  return (
    <div className="relative px-3 sm:px-4 py-2.5 bg-[#086288] border-t border-[#4D8DBA]/35 shrink-0 z-20 select-none">
      {/* Hidden File Pickers */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleImagePicked}
        className="hidden"
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
        onChange={handleDocPicked}
        className="hidden"
      />

      {/* Attachment Popover Menu */}
      <AnimatePresence>
        {showAttachMenu && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowAttachMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-16 left-4 z-40 bg-[#032433] border border-[#4D8DBA]/70 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-48 backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#4D8DBA]/30 text-white text-xs font-medium transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#086288] flex items-center justify-center text-[#97D7FF]">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span>Photos & videos</span>
              </button>

              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#4D8DBA]/30 text-white text-xs font-medium transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#086288] flex items-center justify-center text-[#FFEFC4]">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Document</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSendMessage("Live location shared", "location", {
                    locationName: "Campus Central Plaza",
                  });
                  setShowAttachMenu(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#4D8DBA]/30 text-white text-xs font-medium transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#086288] flex items-center justify-center text-rose-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>Location</span>
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
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="absolute bottom-16 left-12 z-40 bg-[#032433] border border-[#4D8DBA]/70 rounded-2xl p-3 shadow-2xl w-64 backdrop-blur-xl"
            >
              <div className="grid grid-cols-5 gap-2">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                      textareaRef.current?.focus();
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#4D8DBA]/30 text-lg hover:scale-125 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Recording Voice Note Mode */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 bg-[#032433] border border-[#4D8DBA]/50 rounded-2xl p-2 px-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-[#FFEFC4]">
              Recording{" "}
              {`${Math.floor(recordingSeconds / 60)}:${
                recordingSeconds % 60 < 10 ? "0" : ""
              }${recordingSeconds % 60}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-1.5 px-3 rounded-xl text-slate-300 hover:text-white hover:bg-[#4D8DBA]/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-rose-300" />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={handleSendVoiceNote}
              className="p-1.5 px-3 rounded-xl bg-[#97D7FF] text-[#086288] text-xs font-bold flex items-center gap-1 shadow-md hover:bg-[#b4e3ff] transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Send</span>
            </button>
          </div>
        </div>
      ) : (
        /* WhatsApp Web Bottom Dock: (+) Clip, Smile, "Type a message", Mic/Send */
        <div className="flex items-center gap-2">
          {/* 1. Attachment Clip (+) on Left */}
          <button
            type="button"
            onClick={() => setShowAttachMenu((p) => !p)}
            className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#4D8DBA]/25 transition shrink-0 cursor-pointer"
            title="Attach (+)"
          >
            <Plus className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </button>

          {/* 2. Emoji Toggle on Left */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((p) => !p)}
            className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#4D8DBA]/25 transition shrink-0 cursor-pointer"
            title="Emojis"
          >
            <Smile className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </button>

          {/* 3. "Type a message" Rounded Container */}
          <div className="flex-1 bg-[#053b53] border border-[#4D8DBA]/40 rounded-2xl focus-within:border-[#97D7FF] focus-within:ring-1 focus-within:ring-[#97D7FF]/50 transition-all px-3.5 py-1.5 flex items-center">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Type a message"
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 outline-none resize-none max-h-32 leading-relaxed my-0.5"
            />
          </div>

          {/* 4. Mic / Voice Note on Far Right (Send if text is non-empty) */}
          {text.trim().length > 0 ? (
            <motion.button
              type="button"
              onClick={handleSend}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 sm:p-3 rounded-full bg-[#97D7FF] text-[#086288] font-bold shadow-lg shadow-[#086288]/40 hover:bg-[#b4e3ff] transition shrink-0 cursor-pointer"
              title="Send Message"
            >
              <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={() => setIsRecording(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#4D8DBA]/25 transition shrink-0 cursor-pointer"
              title="Voice message"
            >
              <Mic className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
