"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check, Send, Forward } from "lucide-react";
import { ChatContact, ChatMessage } from "@/types/chat";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface ForwardModalProps {
  isOpen: boolean;
  contacts: ChatContact[];
  onClose: () => void;
  onConfirmForward: (targetContactIds: string[]) => void;
  messageToForward?: ChatMessage | null;
  selectedCount?: number;
}

export function ForwardModal({
  isOpen,
  contacts,
  onClose,
  onConfirmForward,
  messageToForward,
  selectedCount = 1,
}: ForwardModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedContactIds([]);
      setSearchQuery("");
      setIsSending(false);
    }
  }, [isOpen]);

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

  // Filter contacts by search query (exclude blocked/unfriended where messaging is disallowed)
  const availableContacts = contacts.filter(
    (c) => !c.isBlocked && !c.isUnfriended && !c.isUnfriendedByPartner
  );

  const filteredContacts = availableContacts.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.toLowerCase().includes(query)) ||
      (c.about && c.about.toLowerCase().includes(query))
    );
  });

  const toggleSelect = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSend = async () => {
    if (selectedContactIds.length === 0 || isSending) return;
    setIsSending(true);
    try {
      await onConfirmForward(selectedContactIds);
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  const previewSnippet = messageToForward?.text
    ? messageToForward.text
    : messageToForward?.mediaType
    ? `[${messageToForward.mediaType.toUpperCase()}] ${messageToForward.mediaMeta?.fileName || ""}`
    : `${selectedCount} message(s)`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-md bg-[#053b53] border border-[#4D8DBA]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 bg-[#032433] border-b border-[#4D8DBA]/35 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#4D8DBA]/25 text-[#97D7FF]">
                <Forward className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Forward message to...
                </h3>
                <p className="text-xs text-slate-300 truncate max-w-[240px]">
                  {previewSnippet}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#4D8DBA]/25 text-slate-300 hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 bg-[#032433]/70 border-b border-[#4D8DBA]/25 shrink-0">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends or contacts..."
                autoFocus
                className="w-full bg-[#053b53] text-white text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl border border-[#4D8DBA]/35 focus:outline-none focus:border-[#97D7FF] transition placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-slate-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#4D8DBA]/15 py-1">
            {filteredContacts.length === 0 ? (
              <div className="py-12 px-4 text-center select-none text-slate-300">
                <p className="text-sm font-medium">No active contacts found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchQuery ? "Try searching with a different name" : "Add friends to start forwarding messages"}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContactIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => toggleSelect(contact.id)}
                    className={cn(
                      "px-4 py-2.5 flex items-center gap-3 transition cursor-pointer select-none",
                      isSelected
                        ? "bg-[#086288]/40 hover:bg-[#086288]/60"
                        : "hover:bg-[#032433]/50"
                    )}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                        isSelected
                          ? "bg-[#97D7FF] border-[#97D7FF] text-[#086288]"
                          : "border-slate-400 bg-black/20"
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-10 h-10 rounded-full"
                      />
                    </div>


                    {/* Contact Details */}
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {contact.name}
                      </h4>
                      <p className="text-xs text-slate-300 truncate">
                        {contact.about || contact.phone || "Six9Chat User"}
                      </p>
                    </div>

                    {contact.isGroup && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4D8DBA]/25 text-[#97D7FF] shrink-0">
                        Group
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Forward Action */}
          <div className="p-3.5 bg-[#032433] border-t border-[#4D8DBA]/35 flex items-center justify-between shrink-0 select-none">
            <span className="text-xs text-slate-300">
              {selectedContactIds.length === 0 ? (
                "Select contacts to forward"
              ) : (
                <span>
                  Forwarding to{" "}
                  <strong className="text-white">
                    {selectedContactIds.length}
                  </strong>{" "}
                  chat{selectedContactIds.length > 1 ? "s" : ""}
                </span>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#4D8DBA]/20 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={selectedContactIds.length === 0 || isSending}
                onClick={handleSend}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] text-[#086288] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#086288]/40 hover:brightness-105 active:scale-95 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? "Sending..." : "Forward"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
