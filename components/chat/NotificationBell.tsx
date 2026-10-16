"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  X,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { ChatRequest } from "@/types/chat";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  requests: ChatRequest[];
  onAccept: (request: ChatRequest) => Promise<void> | void;
  onReject: (requestId: string) => Promise<void> | void;
}

export function NotificationBell({
  requests,
  onAccept,
  onReject,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const pendingCount = pendingRequests.length;

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleAccept = async (req: ChatRequest) => {
    try {
      setActionInProgress(req.id);
      await onAccept(req);
      const display = req.senderUsername
        ? `@${req.senderUsername.replace(/^@/, "")}`
        : req.senderName;
      setToastMessage(`Accepted request from ${display}`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Failed to accept chat request:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (requestId: string, displayHandle: string) => {
    try {
      setActionInProgress(requestId);
      await onReject(requestId);
      setToastMessage(`Declined request from ${displayHandle}`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Failed to reject chat request:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="relative inline-block">
      {/* 1. Header Bar Notification Bell Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative p-2 rounded-xl transition cursor-pointer flex items-center justify-center",
          isOpen
            ? "bg-[#97D7FF] text-[#086288] shadow-md shadow-[#086288]/40"
            : "bg-[#053b53] hover:bg-[#4D8DBA]/40 text-slate-200 hover:text-white border border-[#4D8DBA]/35"
        )}
        title="Chat Notifications & Requests"
        aria-label="Chat notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Real-time Badge Indicator */}
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md ring-2 ring-[#086288] animate-pulse">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {/* 2. Notification Requests Dropdown Modal with Backdrop (Clean positioning, no search bar overlap) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center sm:justify-start pt-16 sm:pt-16 sm:pl-14 p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
            {/* Backdrop Dimmer: click anywhere outside to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 -z-10 bg-transparent"
              aria-hidden="true"
            />

            {/* Dropdown Modal Container */}
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="w-full max-w-sm sm:w-96 rounded-2xl bg-[#086288] border border-[#4D8DBA]/70 p-4 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-hidden flex flex-col max-h-[80vh] ring-1 ring-[#97D7FF]/30"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#4D8DBA]/35 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#4D8DBA]/30 text-[#97D7FF] flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Chat Requests</span>
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFEFC4] text-[#086288] font-black text-[10px]">
                          {pendingCount} new
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 sm:p-2 rounded-xl bg-[#053b53] hover:bg-rose-500/25 text-slate-200 hover:text-white border border-[#4D8DBA]/50 hover:border-rose-400/50 transition cursor-pointer shadow-md flex items-center justify-center group active:scale-95"
                  title="Close Notifications"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5 text-slate-300 group-hover:text-white group-hover:scale-110 transition-transform stroke-[2.5]" />
                </button>
              </div>

              {/* Quick Feedback Toast */}
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#053b53] border border-[#97D7FF]/50 text-[#97D7FF] text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{toastMessage}</span>
                </motion.div>
              )}

              {/* Requests List */}
              <div className="mt-3 overflow-y-auto space-y-2.5 pr-1 flex-1">
                {pendingRequests.length === 0 ? (
                  <div className="py-8 px-4 text-center flex flex-col items-center justify-center text-slate-300">
                    <div className="w-12 h-12 rounded-full bg-[#053b53] border border-[#4D8DBA]/40 flex items-center justify-center mb-2.5 text-[#97D7FF]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-white">No pending requests</p>
                    <p className="text-[11px] text-[#97D7FF]/80 mt-1 max-w-[220px] leading-relaxed">
                      When someone sends you a chat invitation, it will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  pendingRequests.map((req) => {
                    const isBusy = actionInProgress === req.id;
                    // Clean single username display without duplicate stacked name lines
                    const cleanUsername = req.senderUsername
                      ? `@${req.senderUsername.replace(/^@/, "").toLowerCase()}`
                      : req.senderName
                      ? `@${req.senderName.toLowerCase().replace(/\s+/g, "")}`
                      : "@user";

                    return (
                      <motion.div
                        key={req.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-3 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 flex flex-col gap-2.5 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          {/* Requester Avatar (actual uploaded profile picture (DP) if available, otherwise WhatsApp neutral silhouette) */}
                          <Avatar
                            src={req.senderAvatar}
                            alt={cleanUsername}
                            className="w-10 h-10 rounded-full shadow-md ring-2 ring-[#97D7FF]/40 shrink-0"
                            iconClassName="w-3/5 h-3/5 text-slate-200"
                          />

                          {/* Requester Details: Single clean username line with timestamp */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold font-mono text-white truncate">
                                {cleanUsername}
                              </span>
                              <span className="text-[10px] text-slate-300 shrink-0 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-[#4D8DBA]" />
                                {req.createdAt || "Just now"}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#97D7FF]/90 mt-0.5 leading-snug line-clamp-2">
                              {req.message || "wants to start a conversation with you"}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons: Accept & Reject */}
                        <div className="flex items-center gap-2 pt-1 border-t border-[#4D8DBA]/20">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleAccept(req)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] hover:brightness-105 active:scale-95 text-[#086288] font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#086288]/40 transition disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Accept</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReject(req.id, cleanUsername)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-[#032433] hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-[#4D8DBA]/40 active:scale-95 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
