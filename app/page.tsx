"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Shield,
  Zap,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Sparkles,
  Send,
  Smile,
  Hash,
  Paperclip,
  Activity,
  Radio,
  Layers,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

interface ConnectionState {
  status: "checking" | "connected" | "pending" | "error";
  message: string;
  latencyMs?: number;
  details?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  avatar: string;
  color: string;
  time: string;
  text: string;
  isSelf?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "Alex Rivers",
    role: "Core Team",
    avatar: "AR",
    color: "from-[#8E24AA] to-[#1E40AF]",
    time: "18:24",
    text: "Welcome to Six9Chat! Supabase real-time channels are live on WebSocket subscriptions.",
  },
  {
    id: "2",
    sender: "Elena Vance",
    role: "DevOps",
    avatar: "EV",
    color: "from-[#0070F3] to-[#1DB980]",
    time: "18:25",
    text: "Row-Level Security policies active. Sub-15ms broadcast latency verified across client nodes ⚡",
  },
  {
    id: "3",
    sender: "You",
    role: "Principal Engineer",
    avatar: "ME",
    color: "from-[#1DB980] to-[#0070F3]",
    time: "18:26",
    text: "Brand palette and SVG ribbon emblem integrated seamlessly! Ready for launch 🚀",
    isSelf: true,
  },
];

export default function HomePage() {
  const [connection, setConnection] = useState<ConnectionState>({
    status: "checking",
    message: "Verifying Supabase connectivity...",
  });

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [activeChannel, setActiveChannel] = useState("general-chat");

  const checkConnection = async () => {
    setConnection({
      status: "checking",
      message: "Probing Supabase backend...",
    });

    const startTime = performance.now();
    const configured = isSupabaseConfigured();

    if (!configured) {
      setConnection({
        status: "pending",
        message: "Supabase Setup Pending",
        details:
          "Placeholder keys detected in .env.local. Add your real Supabase Project URL and Anon Key to activate live backend services.",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.getSession();
      const latency = Math.round(performance.now() - startTime);

      if (error) {
        setConnection({
          status: "error",
          message: "Connection Error",
          details: error.message,
          latencyMs: latency,
        });
      } else {
        setConnection({
          status: "connected",
          message: "Live & Connected",
          details: "Successfully communicated with Supabase API service.",
          latencyMs: latency,
        });
      }
    } catch (err: unknown) {
      const latency = Math.round(performance.now() - startTime);
      setConnection({
        status: "error",
        message: "Connection Refused",
        details:
          err instanceof Error
            ? err.message
            : "Network error attempting to contact Supabase endpoint.",
        latencyMs: latency,
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "You",
      role: "User",
      avatar: "ME",
      color: "from-[#1DB980] to-[#0070F3]",
      time: "Just now",
      text: inputText.trim(),
      isSelf: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
  };

  // Framer Motion Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="relative min-h-screen bg-[#0F172A] text-slate-100 overflow-hidden flex flex-col justify-between selection:bg-[#1DB980] selection:text-black">
      {/* Dynamic Animated Ambient Background Orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-[#8E24AA]/20 blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-[#1E40AF]/25 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-20 left-1/4 w-[500px] h-[500px] rounded-full bg-[#0070F3]/20 blur-[130px] animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-24 right-10 w-96 h-96 rounded-full bg-[#1DB980]/20 blur-[130px]" />

      {/* Top Navigation */}
      <header className="relative z-30 border-b border-slate-800/80 bg-[#0F172A]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size={42} showText={true} />

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#live-demo" className="hover:text-white transition">
              Live Preview
            </a>
            <a href="#architecture" className="hover:text-white transition">
              Architecture
            </a>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#1DB980] animate-pulse" />
              <span className="text-slate-300">Supabase Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/six9chat-web/Six9Chat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 transition shadow-sm hover:border-slate-600"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              onClick={checkConnection}
              className="relative group overflow-hidden rounded-xl p-[1px] focus:outline-none"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] rounded-xl transition-all duration-300 group-hover:opacity-100 opacity-80" />
              <span className="relative flex items-center gap-2 px-4 py-2 rounded-[11px] bg-[#0F172A] text-xs sm:text-sm font-semibold text-white transition-colors duration-200 group-hover:bg-opacity-90">
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#1DB980] ${
                    connection.status === "checking" ? "animate-spin" : ""
                  }`}
                />
                <span>Probe DB</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero & Interactive Showcase */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20 flex-1 flex flex-col items-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center text-center"
        >
          {/* Brand Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-inner mb-6"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB980] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1DB980]" />
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Next.js 16 + Supabase Real-Time Engine
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#1E40AF]/40 text-[#0070F3] border border-[#0070F3]/30">
              v1.0 Ready
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl leading-[1.12]"
          >
            The Instant Messaging Platform Built for{" "}
            <span className="text-gradient-brand">High Velocity</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed"
          >
            Six9Chat combines real-time PostgreSQL replication, instant presence
            sync, and military-grade encryption with a fluid glassmorphic UI.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#live-demo"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] shadow-lg shadow-[#0070F3]/25 hover:shadow-xl hover:shadow-[#1DB980]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Explore Live Interface</span>
              <ChevronRight className="w-4 h-4" />
            </a>

            <a
              href="https://github.com/six9chat-web/Six9Chat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700 transition-all hover:scale-[1.02]"
            >
              <span>View Source Code</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </motion.div>

          {/* Live Supabase Connection Card */}
          <motion.div
            variants={itemVariants}
            className="mt-12 w-full max-w-2xl text-left gradient-border-box shadow-2xl"
          >
            <div className="rounded-[15px] p-6 bg-[#0F172A]/90 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[#1DB980]">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                      Supabase Cloud Node Status
                    </h3>
                    <p className="text-xs text-slate-400">
                      PostgreSQL Connection & Real-Time Broadcast
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {connection.status === "checking" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      Testing Ping...
                    </span>
                  )}
                  {connection.status === "connected" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1DB980]/15 text-[#1DB980] border border-[#1DB980]/30 shadow-sm shadow-[#1DB980]/10">
                      <span className="w-2 h-2 rounded-full bg-[#1DB980]" />
                      Live & Healthy{" "}
                      {connection.latencyMs ? `(${connection.latencyMs}ms)` : ""}
                    </span>
                  )}
                  {connection.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0070F3]/15 text-[#0070F3] border border-[#0070F3]/30">
                      <span className="w-2 h-2 rounded-full bg-[#0070F3] animate-pulse" />
                      Setup Pending
                    </span>
                  )}
                  {connection.status === "error" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Failed
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-300">
                <p className="font-semibold text-slate-200">{connection.message}</p>
                {connection.details && (
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {connection.details}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Active Endpoint:{" "}
                  <code className="text-slate-300">rjoxghjmtrsfdhbfkodr.supabase.co</code>
                </span>
                <button
                  onClick={checkConnection}
                  className="inline-flex items-center gap-1.5 text-[#1DB980] hover:text-[#1DB980]/80 transition font-medium"
                >
                  <span>Re-test Connection</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Live Interactive Chat Mockup Section */}
        <section id="live-demo" className="mt-20 w-full max-w-5xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0070F3] mb-2">
              Interactive Prototype
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Experience the Real-Time Feed
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-lg">
              Try sending a message in the channel below to test the instant reactive state!
            </p>
          </div>

          <div className="gradient-border-box shadow-2xl">
            <div className="rounded-[15px] bg-[#0F172A]/90 backdrop-blur-xl border border-slate-800/60 overflow-hidden flex flex-col md:flex-row min-h-[520px]">
              {/* Sidebar Channels */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-900/60 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#8E24AA] to-[#0070F3] flex items-center justify-center">
                      <Radio className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm text-white">Channels</span>
                  </div>

                  <div className="space-y-1">
                    {[
                      { id: "general-chat", name: "general-chat", unread: 2 },
                      { id: "announcements", name: "announcements", unread: 0 },
                      { id: "random-vibes", name: "random-vibes", unread: 5 },
                      { id: "devops-feed", name: "devops-feed", unread: 0 },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => setActiveChannel(ch.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                          activeChannel === ch.id
                            ? "bg-gradient-to-r from-[#1DB980]/20 to-[#0070F3]/20 text-white border border-[#1DB980]/30"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ch.name}</span>
                        </div>
                        {ch.unread > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8E24AA] text-white">
                            {ch.unread}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#1DB980] to-[#0070F3] flex items-center justify-center font-bold text-xs text-white">
                      ME
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#1DB980] ring-2 ring-[#0F172A]" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white">You</span>
                      <span className="text-[10px] text-[#1DB980]">Online (Subscribed)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Message Viewport */}
              <div className="flex-1 flex flex-col justify-between bg-[#0F172A]/70">
                {/* Header */}
                <div className="h-14 px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#1DB980]" />
                    <span className="font-bold text-sm text-white">#{activeChannel}</span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      • Real-Time Broadcast Active
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-[#1DB980] animate-pulse" />
                    <span>3 Users Online</span>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="p-6 space-y-4 overflow-y-auto max-h-[340px]">
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex items-start gap-3 ${
                          msg.isSelf ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!msg.isSelf && (
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${msg.color} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md`}
                          >
                            {msg.avatar}
                          </div>
                        )}

                        <div className={`max-w-md ${msg.isSelf ? "items-end text-right" : ""}`}>
                          <div
                            className={`flex items-baseline gap-2 mb-1 ${
                              msg.isSelf ? "justify-end" : ""
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-200">
                              {msg.sender}
                            </span>
                            <span className="text-[10px] text-slate-500">{msg.time}</span>
                          </div>

                          <div
                            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium ${
                              msg.isSelf
                                ? "bg-gradient-to-r from-[#0070F3] to-[#1DB980] text-white rounded-tr-none shadow-lg shadow-[#0070F3]/20"
                                : "bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/60"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>

                        {msg.isSelf && (
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${msg.color} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md`}
                          >
                            {msg.avatar}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing Indicator */}
                  <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1DB980] animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0070F3] animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8E24AA] animate-bounce [animation-delay:0.4s]" />
                    </span>
                    <span className="text-[11px] text-slate-400 italic">
                      Sarah is typing...
                    </span>
                  </div>
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-slate-800/80 bg-slate-900/50 flex items-center gap-3"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Message #${activeChannel}...`}
                      className="w-full bg-slate-800/80 border border-slate-700/80 focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-white hover:opacity-95 shadow-md shadow-[#1DB980]/20 transition shrink-0 transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="features" className="mt-28 w-full max-w-6xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1DB980]">
              Built for Scale
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Next-Generation Chat Infrastructure
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-[#1DB980]/15 border border-[#1DB980]/30 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6 text-[#1DB980]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sub-15ms Latency</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Direct WebSocket multiplexing powered by Supabase Realtime delivers
                messages instantaneously worldwide.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-[#8E24AA]/15 border border-[#8E24AA]/30 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-[#8E24AA]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Row-Level Security</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                PostgreSQL RLS guarantees channel isolation, user authorization, and
                tamper-proof direct message privacy.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-[#0070F3]/15 border border-[#0070F3]/30 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6 text-[#0070F3]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Modular UI System</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Tailwind CSS v4 and Framer Motion micro-interactions provide a fluid,
                native-like SaaS experience.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-30 border-t border-slate-800/80 bg-[#0F172A]/90 py-10 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size={36} showText={true} />

          <p className="text-xs text-slate-500">
            © 2026 Six9Chat. Powered by Next.js 16, Supabase, Tailwind CSS v4 & Framer Motion.
          </p>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <a
              href="https://github.com/six9chat-web/Six9Chat"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
