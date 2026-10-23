"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (deleteForEveryone: boolean) => void;
  isSelfSender: boolean;
  count?: number;
}

export function DeleteMessageModal({
  isOpen,
  onClose,
  onConfirmDelete,
  isSelfSender,
  count = 1,
}: DeleteMessageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-sm bg-[#053b53] border border-[#4D8DBA]/40 rounded-2xl shadow-2xl overflow-hidden p-5 text-center select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-400">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-white tracking-tight mb-1.5">
            {count > 1 ? `Delete ${count} messages?` : "Delete message?"}
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed mb-5">
            {isSelfSender
              ? "You can delete this message for everyone in this chat or only for yourself."
              : "This message will be removed from your view only."}
          </p>

          <div className="flex flex-col gap-2">
            {isSelfSender && (
              <button
                type="button"
                onClick={() => {
                  onConfirmDelete(true);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-900/40 active:scale-95 transition cursor-pointer"
              >
                Delete for Everyone
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onConfirmDelete(false);
                onClose();
              }}
              className={cn(
                "w-full py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95",
                isSelfSender
                  ? "bg-[#086288] hover:bg-[#4D8DBA] text-white border border-[#4D8DBA]/50"
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/40"
              )}
            >
              Delete for Me
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl bg-transparent hover:bg-[#4D8DBA]/20 text-slate-300 hover:text-white font-medium text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
