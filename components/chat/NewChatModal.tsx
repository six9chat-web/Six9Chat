"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, Users, MessageSquare } from "lucide-react";
import { ChatContact } from "@/types/chat";

interface NewChatModalProps {
  isOpen: boolean;
  contacts: ChatContact[];
  onClose: () => void;
  onSelectContact: (id: string) => void;
  onAddNewContact: (name: string, phone: string) => void;
}

export function NewChatModal({
  isOpen,
  contacts,
  onClose,
  onSelectContact,
  onAddNewContact,
}: NewChatModalProps) {
  const [filter, setFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  if (!isOpen) return null;

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddNewContact(newName.trim(), newPhone.trim() || "+1 (555) 000-0000");
    setNewName("");
    setNewPhone("");
    setShowAddForm(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1DB980]" />
              <span>New Conversation</span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Contacts Input */}
          {!showAddForm && (
            <div className="my-3">
              <div className="relative flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full bg-transparent text-white placeholder-slate-400 outline-none"
                />
              </div>

              {/* Add New Contact Button */}
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-[#1DB980] transition"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1DB980]/20 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span>Create New Contact</span>
              </button>
            </div>
          )}

          {/* Add Form */}
          {showAddForm ? (
            <form onSubmit={handleCreateContact} className="space-y-3 py-4 text-xs">
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-[#1DB980]"
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
                  placeholder="e.g. +1 (555) 923-4567"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-[#1DB980]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-white font-bold hover:opacity-95 transition"
                >
                  Add & Message
                </button>
              </div>
            </form>
          ) : (
            /* Contact List */
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-800/40">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block py-1">
                Contacts on Six9Chat
              </span>
              {filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectContact(c.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 cursor-pointer transition"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1DB980] to-[#0070F3] flex items-center justify-center font-bold text-xs text-white">
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{c.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {c.about || c.phone || "Six9Chat User"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
