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
  Radio,
} from "lucide-react";
import { ChatContact } from "@/types/chat";
import { Avatar } from "@/components/ui/Avatar";
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

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setStatus("calling");
      setDuration(0);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md sm:max-w-lg bg-[#086288] border border-[#4D8DBA]/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden"
        >
          {/* Subtle Ambient Light Gradients */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-60 h-60 bg-[#4D8DBA]/25 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-60 h-60 bg-[#97D7FF]/20 rounded-full blur-3xl" />

          {/* HD Quality Call Badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#FFEFC4] bg-[#053b53]/80 border border-[#4D8DBA]/50 px-3 py-1 rounded-full mb-6">
            <Radio className="w-3.5 h-3.5 text-[#97D7FF] animate-pulse" />
            <span>HD Voice & Video Stream</span>
          </div>

          {/* Caller Avatar with Animated Rings */}
          <div className="relative my-4">
            {status === "calling" && (
              <>
                <span className="absolute -inset-3 rounded-full bg-[#97D7FF]/30 animate-ping opacity-75" />
                <span className="absolute -inset-6 rounded-full bg-[#4D8DBA]/25 animate-pulse" />
              </>
            )}

            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-2xl overflow-hidden ring-4 ring-[#97D7FF]/30">
              <Avatar
                src={contact.avatar}
                alt={contact.name}
                className="w-full h-full"
                iconClassName="w-16 h-16 text-slate-200"
              />
            </div>
          </div>

          {/* Contact Name & Call Status */}
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-2">
            {contact.name}
          </h3>

          <p className="text-sm text-slate-200 mt-1 font-mono">
            {status === "calling" ? (
              <span className="text-[#97D7FF] animate-pulse">Ringing...</span>
            ) : (
              <span>Call Connected • {formatTime(duration)}</span>
            )}
          </p>

          {/* Video Preview Mockup Window if Video Call */}
          {type === "video" && status === "connected" && (
            <div className="w-full mt-6 aspect-video bg-[#053b53] rounded-2xl border border-[#4D8DBA]/40 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-[#053b53] via-transparent to-transparent z-10" />
              <p className="text-xs text-slate-200 z-20">
                {isVideoDisabled ? "Your camera is off" : "Remote Video Stream Active (720p HD)"}
              </p>

              {/* PiP Local Video Thumbnail */}
              <div className="absolute bottom-3 right-3 w-20 h-14 bg-[#086288] rounded-lg border border-[#4D8DBA]/50 flex items-center justify-center text-[10px] text-[#97D7FF] z-20 shadow-lg">
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
                  ? "bg-rose-500/30 text-rose-300 border border-rose-400/50"
                  : "bg-[#053b53] hover:bg-[#4D8DBA]/30 text-slate-200 border border-[#4D8DBA]/40"
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
                    ? "bg-rose-500/30 text-rose-300 border border-rose-400/50"
                    : "bg-[#053b53] hover:bg-[#4D8DBA]/30 text-slate-200 border border-[#4D8DBA]/40"
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
                  ? "bg-amber-500/30 text-amber-200 border border-amber-400/50"
                  : "bg-[#053b53] hover:bg-[#4D8DBA]/30 text-slate-200 border border-[#4D8DBA]/40"
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
              className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/40 transition hover:scale-105 active:scale-95 cursor-pointer"
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
