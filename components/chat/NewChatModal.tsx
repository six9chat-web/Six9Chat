"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  UserPlus,
  Users,
  MessageSquare,
  Phone,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ChatContact } from "@/types/chat";
import { formatE164 } from "@/lib/phoneUtils";

interface NewChatModalProps {
  isOpen: boolean;
  contacts: ChatContact[];
  onClose: () => void;
  onSelectContact: (id: string) => void;
  onAddNewContact: (name: string, phone: string) => void;
  onOpenNewGroup?: () => void;
}

export function NewChatModal({
  isOpen,
  contacts,
  onClose,
  onSelectContact,
  onAddNewContact,
  onOpenNewGroup,
}: NewChatModalProps) {
  const [filter, setFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  if (!isOpen) return null;

  // Direct contacts list
  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.phone && c.phone.includes(filter))
  );

  // Check if search query contains a potential phone number
  const hasDigits = filter.replace(/\D/g, "").length >= 7;
  const normalizedPhone = hasDigits ? formatE164("+92", filter).e164 : "";

  const handleStartPhoneChat = (phoneNumber: string) => {
    onAddNewContact(phoneNumber, phoneNumber);
    onClose();
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddNewContact(newName.trim(), newPhone.trim() || "+1 (555) 000-0000");
    setNewName("");
    setNewPhone("");
    setShowAddForm(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1DB980]" />
              <span>New Chat</span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!showAddForm ? (
            <>
              {/* Search input */}
              <div className="my-3">
                <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus-within:border-[#1DB980] transition">
                  <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search name or type phone number..."
                    className="w-full bg-transparent text-white placeholder-slate-500 outline-none"
                    autoFocus
                  />
                  {filter && (
                    <button
                      type="button"
                      onClick={() => setFilter("")}
                      className="text-slate-400 hover:text-white ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Direct Phone Number Chat Quick Prompt */}
              {hasDigits && (
                <div
                  onClick={() => handleStartPhoneChat(normalizedPhone || filter)}
                  className="mb-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Message {normalizedPhone || filter}
                      </p>
                      <p className="text-[11px] text-emerald-300">
                        Start direct WhatsApp-style conversation
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </div>
              )}

              {/* Quick Action Rows: New Group & New Contact */}
              <div className="space-y-1.5 pb-2 border-b border-slate-800/80">
                {onOpenNewGroup && (
                  <div
                    onClick={() => {
                      onClose();
                      onOpenNewGroup();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-800/60 cursor-pointer transition select-none"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1DB980] text-black flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">New group</h4>
                      <p className="text-[11px] text-slate-400">
                        Create community with multiple contacts
                      </p>
                    </div>
                  </div>
                )}

                <div
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-800/60 cursor-pointer transition select-none"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-[#1DB980] flex items-center justify-center font-bold border border-slate-700">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">New contact</h4>
                    <p className="text-[11px] text-slate-400">
                      Add a new person to your address book
                    </p>
                  </div>
                </div>
              </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 pt-2 divide-y divide-slate-800/40">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block py-1">
                  Contacts on Six9Chat ({filtered.length})
                </span>
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectContact(c.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1DB980] to-[#0070F3] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                      {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {c.about || c.phone || "Hey there! I am using Six9Chat"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Create Contact Form */
            <form onSubmit={handleCreateContact} className="space-y-4 py-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Contact Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jordan Blake"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#1DB980]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +92 341 4348189"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#1DB980]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-black font-extrabold hover:opacity-95 transition cursor-pointer"
                >
                  Save & Message
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
