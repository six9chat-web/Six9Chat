"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Maximize2,
  Shield,
} from "lucide-react";
import { ChatContact } from "@/types/chat";
import { cn } from "@/lib/utils";

interface CallModalProps {
  isOpen: boolean;
  type: "audio" | "video";
  contact: ChatContact | null;
  onEndCall: () => void;
}

export function CallModal({
  isOpen,
  type,
  contact,
  onEndCall,
}: CallModalProps) {
  const [status, setStatus] = useState<"calling" | "connected">("calling");
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStatus("calling");
      setDuration(0);
      return;
    }

    // Simulate answering after 2 seconds
    const answerTimer = setTimeout(() => {
      setStatus("connected");
    }, 2200);

    return () => clearTimeout(answerTimer);
  }, [isOpen]);

  useEffect(() => {
    if (status !== "connected") return;

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  if (!isOpen || !contact) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md sm:max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden"
        >
          {/* Subtle Ambient Light Gradients */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-60 h-60 bg-[#1DB980]/20 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-60 h-60 bg-[#0070F3]/20 rounded-full blur-3xl" />

          {/* Encryption Badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full mb-6">
            <Shield className="w-3.5 h-3.5" />
            <span>End-to-End Encrypted Call</span>
          </div>

          {/* Caller Avatar with Animated Rings */}
          <div className="relative my-4">
            {status === "calling" && (
              <>
                <span className="absolute -inset-3 rounded-full bg-[#1DB980]/20 animate-ping opacity-75" />
                <span className="absolute -inset-6 rounded-full bg-[#0070F3]/15 animate-pulse" />
              </>
            )}

            <div
              className={cn(
                "relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-2xl bg-gradient-to-tr",
                contact.avatarColor || "from-[#1DB980] to-[#0070F3]"
              )}
            >
              {contact.avatar}
            </div>
          </div>

          {/* Contact Name & Call Status */}
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-2">
            {contact.name}
          </h3>

          <p className="text-sm text-slate-400 mt-1 font-mono">
            {status === "calling" ? (
              <span className="text-[#1DB980] animate-pulse">Ringing...</span>
            ) : (
              <span>Call Connected • {formatTime(duration)}</span>
            )}
          </p>

          {/* Video Preview Mockup Window if Video Call */}
          {type === "video" && status === "connected" && (
            <div className="w-full mt-6 aspect-video bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
              <p className="text-xs text-slate-400 z-20">
                {isVideoDisabled ? "Your camera is off" : "Remote Video Stream Active (720p HD)"}
              </p>

              {/* PiP Local Video Thumbnail */}
              <div className="absolute bottom-3 right-3 w-20 h-14 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center text-[10px] text-slate-300 z-20 shadow-lg">
                <span>You</span>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 z-10">
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted((p) => !p)}
              className={cn(
                "p-3.5 rounded-full transition shadow-lg",
                isMuted
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              )}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Camera Toggle (for video calls) */}
            {type === "video" && (
              <button
                type="button"
                onClick={() => setIsVideoDisabled((p) => !p)}
                className={cn(
                  "p-3.5 rounded-full transition shadow-lg",
                  isVideoDisabled
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                )}
                title={isVideoDisabled ? "Turn camera on" : "Turn camera off"}
              >
                {isVideoDisabled ? (
                  <VideoOff className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Speaker Toggle */}
            <button
              type="button"
              onClick={() => setIsSpeakerMuted((p) => !p)}
              className={cn(
                "p-3.5 rounded-full transition shadow-lg",
                isSpeakerMuted
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              )}
              title="Speaker Toggle"
            >
              {isSpeakerMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={onEndCall}
              className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/40 transition hover:scale-105 active:scale-95"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
