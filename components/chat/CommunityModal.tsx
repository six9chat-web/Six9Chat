"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Radio,
  Plus,
  X,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Megaphone,
  Globe,
} from "lucide-react";

interface CommunityItem {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  avatar: string;
  avatarBg: string;
  isChannel?: boolean;
}

const DEFAULT_COMMUNITIES: CommunityItem[] = [
  {
    id: "comm-1",
    name: "Six9 Official Announcements",
    description: "Verified updates, releases, and architecture announcements from Six9 core team.",
    membersCount: 4120,
    avatar: "📢",
    avatarBg: "from-[#086288] via-[#4D8DBA] to-[#97D7FF]",
    isChannel: true,
  },
  {
    id: "comm-2",
    name: "Realtime Systems & Architecture",
    description: "Deep-dives into WebSocket clustering, Supabase RLS, and low-latency state sync.",
    membersCount: 1840,
    avatar: "⚡",
    avatarBg: "from-[#086288] to-[#4D8DBA]",
  },
  {
    id: "comm-3",
    name: "Frontend & Motion Experience",
    description: "Framer Motion, glassmorphism, responsive dual-pane ergonomics, and design systems.",
    membersCount: 2310,
    avatar: "🎨",
    avatarBg: "from-[#4D8DBA] to-[#FFEFC4]",
  },
  {
    id: "comm-4",
    name: "Security, Cryptography & RLS",
    description: "End-to-end encrypted messaging discussions, double ratchet protocol, and audit logs.",
    membersCount: 970,
    avatar: "🛡️",
    avatarBg: "from-[#053b53] to-[#97D7FF]",
  },
];

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCommunity: (name: string, description: string, isChannel: boolean) => void;
}

export function CommunityModal({
  isOpen,
  onClose,
  onCreateCommunity,
}: CommunityModalProps) {
  const [activeTab, setActiveTab] = useState<"browse" | "create">("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isChannelType, setIsChannelType] = useState(false);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const filteredCommunities = DEFAULT_COMMUNITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateCommunity(newTitle.trim(), newDesc.trim() || "Community channel", isChannelType);
    setNewTitle("");
    setNewDesc("");
    setActiveTab("browse");
    onClose();
  };

  const handleJoin = (item: CommunityItem) => {
    if (!joinedIds.includes(item.id)) {
      setJoinedIds((prev) => [...prev, item.id]);
      onCreateCommunity(item.name, item.description, Boolean(item.isChannel));
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#086288] border border-[#4D8DBA]/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-slate-100"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-[#086288] border-b border-[#4D8DBA]/35 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#053b53] border border-[#4D8DBA]/50 flex items-center justify-center text-[#97D7FF]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Communities &amp; Channels</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#97D7FF]/20 text-[#FFEFC4] font-semibold border border-[#97D7FF]/30">
                    WhatsApp Web 2.0
                  </span>
                </h3>
                <p className="text-[11px] text-slate-200">
                  Topic-based hubs and broadcast announcements
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-200 hover:text-white hover:bg-[#4D8DBA]/25 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="p-4 pb-2 border-b border-[#4D8DBA]/30 flex items-center gap-2 bg-[#053b53]/40">
            <button
              type="button"
              onClick={() => setActiveTab("browse")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "browse"
                  ? "bg-[#97D7FF] text-[#086288] shadow-md shadow-[#086288]/40"
                  : "bg-[#053b53] text-slate-300 hover:text-white hover:bg-[#4D8DBA]/30"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Explore Communities ({DEFAULT_COMMUNITIES.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "create"
                  ? "bg-[#FFEFC4] text-[#086288] shadow-md shadow-[#086288]/40"
                  : "bg-[#053b53] text-slate-300 hover:text-white hover:bg-[#4D8DBA]/30"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Community / Channel</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "browse" ? (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative flex items-center bg-[#053b53] border border-[#4D8DBA]/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus-within:border-[#97D7FF] transition">
                  <Search className="w-4 h-4 text-[#4D8DBA] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search communities or broadcast channels..."
                    className="w-full bg-transparent text-white placeholder-slate-300 outline-none text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-slate-300 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Communities List */}
                <div className="space-y-2.5 pt-2">
                  {filteredCommunities.map((item) => {
                    const isJoined = joinedIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-[#053b53]/80 border border-[#4D8DBA]/40 hover:border-[#97D7FF]/60 transition flex items-start gap-3.5 group"
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.avatarBg} flex items-center justify-center text-xl shrink-0 shadow-md ring-2 ring-[#4D8DBA]/40`}
                        >
                          {item.avatar}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-white group-hover:text-[#FFEFC4] transition truncate">
                              {item.name}
                            </h4>
                            {item.isChannel && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#FFEFC4]/20 text-[#FFEFC4] border border-[#FFEFC4]/30 font-semibold flex items-center gap-1">
                                <Megaphone className="w-2.5 h-2.5" /> Channel
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-300">
                            <span>👥 {(item.membersCount + (isJoined ? 1 : 0)).toLocaleString()} members</span>
                            <span>•</span>
                            <span className="text-[#97D7FF] font-medium flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-[#97D7FF]" /> Supabase Broadcast
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleJoin(item)}
                          disabled={isJoined}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                            isJoined
                              ? "bg-[#086288] border border-[#4D8DBA] text-[#97D7FF]"
                              : "bg-[#97D7FF] hover:bg-[#b4e3ff] text-[#086288] shadow-md"
                          }`}
                        >
                          {isJoined ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Joined</span>
                            </>
                          ) : (
                            <>
                              <span>Join</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Create Community Form */
              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-200 font-semibold mb-1.5">
                    Community / Channel Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Next.js 16 Engineers Club"
                    className="w-full bg-[#053b53] border border-[#4D8DBA]/40 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#97D7FF] text-xs"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-slate-200 font-semibold mb-1.5">
                    Description &amp; Guidelines
                  </label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe what members can expect in this community..."
                    className="w-full bg-[#053b53] border border-[#4D8DBA]/40 rounded-xl px-4 py-2 text-white outline-none focus:border-[#97D7FF] resize-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-200 font-semibold mb-2">
                    Community Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsChannelType(false)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        !isChannelType
                          ? "bg-[#4D8DBA]/30 border-[#97D7FF] text-white"
                          : "bg-[#053b53] border-[#4D8DBA]/35 text-slate-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-[#97D7FF]" />
                        <span className="font-bold text-xs">Group Community</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-normal">
                        All members can send messages, audio, and reactions.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsChannelType(true)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        isChannelType
                          ? "bg-[#4D8DBA]/30 border-[#FFEFC4] text-white"
                          : "bg-[#053b53] border-[#4D8DBA]/35 text-slate-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Radio className="w-4 h-4 text-[#FFEFC4]" />
                        <span className="font-bold text-xs">Broadcast Channel</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-normal">
                        Only admins broadcast updates; subscribers react.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!newTitle.trim()}
                    className="w-full py-3.5 rounded-xl bg-[#97D7FF] text-[#086288] font-black text-xs uppercase tracking-wider hover:bg-[#b4e3ff] transition shadow-lg shadow-[#086288]/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Create &amp; Launch Community</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
