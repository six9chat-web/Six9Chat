"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { useTranslation } from "@/lib/LanguageContext";
import { cn, getCleanDisplayName } from "@/lib/utils";

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
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const pendingCount = pendingRequests.length;

  // Close modal on Escape key press or outside click
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAccept = async (req: ChatRequest) => {
    try {
      setActionInProgress(req.id);
      await onAccept(req);
      const display = getCleanDisplayName(req.senderName, req.senderUsername, "User");
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
    <div ref={containerRef} className="relative inline-block z-50">
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
        title={t("chatRequests", "Chat Requests")}
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

      {/* 2. Notification Requests Dropdown: Anchored directly below Bell Icon */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay for outside click */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[0.5px]"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Anchored Dropdown Menu */}
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl bg-[#053b53] border border-[#4D8DBA]/70 p-3.5 shadow-2xl backdrop-blur-2xl text-slate-100 flex flex-col max-h-[75vh] z-50 ring-1 ring-[#97D7FF]/40"
            >
              {/* Header with crisp Close Cross button */}
              <div className="flex items-center justify-between pb-3 border-b border-[#4D8DBA]/35 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4D8DBA]/30 text-[#97D7FF] flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                      <span>{t("chatRequests", "Chat Requests")}</span>
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFEFC4] text-[#086288] font-black text-[10px]">
                          {pendingCount} new
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                {/* Crisp Close Cross Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-rose-500/25 border border-transparent hover:border-rose-400/40 transition cursor-pointer flex items-center justify-center group active:scale-95"
                  title="Close Notifications"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4 text-slate-300 group-hover:text-white group-hover:scale-110 transition-transform stroke-[2.5]" />
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
                    <p className="text-xs font-bold text-white">{t("noPendingRequests", "No pending requests")}</p>
                    <p className="text-[11px] text-[#97D7FF]/80 mt-1 max-w-[220px] leading-relaxed">
                      {t("noPendingRequestsDesc", "When someone sends you a chat invitation, it will appear here in real-time.")}
                    </p>
                  </div>
                ) : (
                  pendingRequests.map((req) => {
                    const isBusy = actionInProgress === req.id;
                    const cleanUsername = getCleanDisplayName(req.senderName, req.senderUsername, "User");

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
                          {/* Requester Avatar */}
                          <Avatar
                            src={req.senderAvatar}
                            alt={cleanUsername}
                            className="w-10 h-10 rounded-full shadow-md ring-2 ring-[#97D7FF]/40 shrink-0"
                            iconClassName="w-3/5 h-3/5 text-slate-200"
                          />

                          {/* Requester Details: Single clean username line with timestamp */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate">
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
                            <span>{t("accept", "Accept")}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleReject(req.id, cleanUsername)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-[#032433] hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-[#4D8DBA]/40 active:scale-95 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t("decline", "Decline")}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
