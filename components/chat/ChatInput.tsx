"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  Plus,
  Mic,
  Send,
  Image as ImageIcon,
  FileText,
  X,
  Check,
  Video,
  Loader2,
} from "lucide-react";

import { MediaType, MediaMeta } from "@/types/chat";
import { EmojiPicker } from "./EmojiPicker";
import { useTranslation } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabaseClient";

interface ChatInputProps {
  onSendMessage: (
    text: string,
    mediaType?: MediaType,
    mediaMeta?: MediaMeta,
    mediaUrl?: string,
    replyTo?: { id: string; senderName: string; text: string }
  ) => void;
  disabled?: boolean;
  replyingTo?: { id: string; senderName: string; text: string } | null;
  onCancelReply?: () => void;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  replyingTo,
  onCancelReply,
}: ChatInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
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

  // Focus textarea when replyingTo changes
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const [prevIsRecording, setPrevIsRecording] = useState(isRecording);
  if (prevIsRecording !== isRecording) {
    setPrevIsRecording(isRecording);
    if (isRecording) {
      setRecordingSeconds(0);
    }
  }

  // Voice recording timer simulation
  useEffect(() => {
    if (isRecording) {
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
    onSendMessage(text.trim(), "text", undefined, undefined, replyingTo || undefined);
    setText("");
    onCancelReply?.();
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

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setShowAttachMenu(false);
      setUploadStatus(`Uploading ${file.name}...`);

      let publicUrl = "";
      let mediaType: MediaType = "document";
      if (file.type.startsWith("image/")) mediaType = "image";
      else if (file.type.startsWith("video/")) mediaType = "video";
      else if (file.type.startsWith("audio/")) mediaType = "audio";

      const fileSizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`;

      // 1. Direct Supabase Storage upload to 'chat-attachments' bucket
      try {
        const fileExt = file.name.split(".").pop() || "bin";
        const filePath = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (!uploadError && uploadData?.path) {
          const { data: pubUrlData } = supabase.storage
            .from("chat-attachments")
            .getPublicUrl(uploadData.path);
          if (pubUrlData?.publicUrl) {
            publicUrl = pubUrlData.publicUrl;
          }
        }
      } catch (clientErr) {
        console.warn("Client Supabase upload notice:", clientErr);
      }

      // 2. Server API route upload fallback
      if (!publicUrl) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/chat/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          publicUrl = data.url;
          if (data.mediaType) mediaType = data.mediaType;
        }
      }

      if (publicUrl) {
        onSendMessage(
          "",
          mediaType,
          {
            fileName: file.name,
            fileSize: fileSizeStr,
          },
          publicUrl
        );
      } else {
        // High-performance local FileReader fallback if both fail
        const reader = new FileReader();
        reader.onload = () => {
          onSendMessage(
            "",
            mediaType,
            {
              fileName: file.name,
              fileSize: fileSizeStr,
            },
            reader.result as string
          );
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn("Media upload error:", err);
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
    }
  };

  return (
    <div className="relative px-3 sm:px-4 py-2.5 bg-[#086288] border-t border-[#4D8DBA]/35 shrink-0 z-20 select-none">
      {/* Hidden File Pickers */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className="hidden"
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
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
              className="absolute bottom-16 left-4 z-40 bg-[#032433] border border-[#4D8DBA]/70 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-52 backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#4D8DBA]/30 text-white text-xs font-medium transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#086288] flex items-center justify-center text-[#97D7FF]">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span>Photos & Images</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#4D8DBA]/30 text-white text-xs font-medium transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#086288] flex items-center justify-center text-[#97D7FF]">
                  <Video className="w-4 h-4" />
                </div>
                <span>Videos</span>
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
            </motion.div>

          </>
        )}
      </AnimatePresence>

      {/* WhatsApp Emoji Picker Popover */}
      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPicker
            onSelectEmoji={(emoji) => {
              setText((prev) => prev + emoji);
              textareaRef.current?.focus();
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* WhatsApp-Style Quoted / Reply Preview Box */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            className="mb-2 p-2.5 px-3 bg-[#032433] border border-[#4D8DBA]/50 border-l-4 border-l-[#97D7FF] rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md"
          >
            <div className="flex-1 min-w-0 pr-3">
              <div className="text-xs font-bold text-[#97D7FF] truncate flex items-center gap-1.5">
                <span>Replying to {replyingTo.senderName}</span>
              </div>
              <div className="text-xs text-slate-300 truncate mt-0.5">
                {replyingTo.text}
              </div>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1 rounded-full hover:bg-[#4D8DBA]/30 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
              title="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
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

          {/* 3. "Type a message" Rounded Container OR Uploading State */}
          {isUploading ? (
            <div className="flex-1 bg-[#053b53] border border-[#97D7FF]/50 rounded-2xl px-4 py-2 flex items-center gap-2.5 text-xs text-[#97D7FF] shadow-inner">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#97D7FF]" />
              <span className="truncate font-medium">{uploadStatus || "Uploading to Supabase Storage..."}</span>
            </div>
          ) : (
            <div className="flex-1 bg-[#053b53] border border-[#4D8DBA]/40 rounded-2xl focus-within:border-[#97D7FF] focus-within:ring-1 focus-within:ring-[#97D7FF]/50 transition-all px-3.5 py-1.5 flex items-center">
              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={t("typeMessage", "Type a message...")}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 outline-none resize-none max-h-32 leading-relaxed my-0.5"
              />
            </div>
          )}

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
