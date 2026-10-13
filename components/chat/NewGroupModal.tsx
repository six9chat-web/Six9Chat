"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Camera,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { ChatContact } from "@/types/chat";
import { cn } from "@/lib/utils";

interface NewGroupModalProps {
  isOpen: boolean;
  contacts: ChatContact[];
  onClose: () => void;
  onCreateGroup: (name: string, memberIds: string[], avatarUrl?: string) => void;
}

const GROUP_GRADIENTS = [
  "from-[#1DB980] via-[#0070F3] to-[#8E24AA]",
  "from-[#0070F3] to-[#1DB980]",
  "from-[#8E24AA] to-[#F43F5E]",
  "from-[#F59E0B] to-[#D97706]",
  "from-[#10B981] to-[#047857]",
];

export function NewGroupModal({
  isOpen,
  contacts,
  onClose,
  onCreateGroup,
}: NewGroupModalProps) {
  // Step 1: Member Selection | Step 2: Group Info
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedGradient, setSelectedGradient] = useState(GROUP_GRADIENTS[0]);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Filter individual contacts (excluding groups)
  const directContacts = contacts.filter((c) => !c.isGroup);
  const filteredContacts = directContacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  const toggleContact = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeContact = (id: string) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAvatar(url);
    }
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedIds.length === 0) return;

    onCreateGroup(groupName.trim(), selectedIds, customAvatar || undefined);
    // Reset state
    setStep(1);
    setSelectedIds([]);
    setGroupName("");
    setCustomAvatar(null);
    onClose();
  };

  const initials = (groupName.trim() || "GP")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-slate-100"
        >
          {/* Top Header */}
          <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-1 rounded-full text-slate-400 hover:text-white transition"
                  title="Back to member selection"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1DB980]" />
                  <span>{step === 1 ? "Add group members" : "New group details"}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {step === 1
                    ? `${selectedIds.length} of ${directContacts.length} selected`
                    : "Provide group name and optional icon"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSelectedIds([]);
                onClose();
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* STEP 1: MEMBER SELECTION */}
          {step === 1 && (
            <div className="flex-1 flex flex-col overflow-hidden p-5 pt-3">
              {/* Selected Member Chips */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar shrink-0">
                  {selectedIds.map((id) => {
                    const contact = contacts.find((c) => c.id === id);
                    if (!contact) return null;
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-200 shrink-0"
                      >
                        <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#1DB980] to-[#0070F3] text-[9px] font-bold flex items-center justify-center text-white">
                          {contact.avatar}
                        </span>
                        <span className="max-w-[90px] truncate">{contact.name}</span>
                        <button
                          type="button"
                          onClick={() => removeContact(id)}
                          className="text-slate-400 hover:text-white ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search input */}
              <div className="relative mb-3 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#1DB980]"
                  autoFocus
                />
              </div>

              {/* Contacts List with Checkboxes */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleContact(contact.id)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition select-none border",
                        isSelected
                          ? "bg-slate-800/90 border-[#1DB980]/50"
                          : "bg-slate-900/50 hover:bg-slate-800/60 border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md bg-gradient-to-tr shrink-0",
                            contact.avatarColor || "from-[#1DB980] to-[#0070F3]"
                          )}
                        >
                          {contact.avatar}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {contact.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {contact.phone || contact.about || "Six9Chat User"}
                          </p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center transition border shrink-0",
                          isSelected
                            ? "bg-[#1DB980] border-[#1DB980] text-black"
                            : "border-slate-700 bg-slate-950"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Floating Next Button */}
              {selectedIds.length > 0 && (
                <div className="pt-4 shrink-0 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-black font-extrabold text-xs shadow-lg shadow-[#1DB980]/20 hover:opacity-95 transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next ({selectedIds.length})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: GROUP NAME & ICON */}
          {step === 2 && (
            <form onSubmit={handleFinish} className="p-6 space-y-5">
              {/* Avatar Selector */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload group picture"
                >
                  <div
                    className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-2xl ring-4 ring-[#1DB980]/30 transition overflow-hidden bg-gradient-to-tr",
                      selectedGradient
                    )}
                  >
                    {customAvatar ? (
                      <img
                        src={customAvatar}
                        alt="Group Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1DB980] text-black flex items-center justify-center shadow-lg border-2 border-[#0F172A] group-hover:scale-110 transition">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />

                {/* Preset Gradients */}
                <div className="flex items-center gap-2 mt-3">
                  {GROUP_GRADIENTS.map((g, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedGradient(g);
                        setCustomAvatar(null);
                      }}
                      className={cn(
                        "w-5 h-5 rounded-full bg-gradient-to-tr transition",
                        g,
                        selectedGradient === g && !customAvatar
                          ? "ring-2 ring-white scale-125"
                          : "opacity-70 hover:opacity-100"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Group Subject Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Group Subject / Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980]"
                    required
                    maxLength={100}
                    autoFocus
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                    {groupName.length}/100
                  </span>
                </div>
              </div>

              {/* Members summary */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Members in this group:</span>
                <span className="font-bold text-emerald-400">
                  {selectedIds.length + 1} participants
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={!groupName.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] text-black font-extrabold text-sm hover:opacity-95 transition shadow-lg shadow-[#1DB980]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Create Group</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
