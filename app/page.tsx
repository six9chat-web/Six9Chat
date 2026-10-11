"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
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
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

interface ConnectionState {
  status: "checking" | "connected" | "pending" | "error";
  message: string;
  latencyMs?: number;
  details?: string;
}

export default function HomePage() {
  const [connection, setConnection] = useState<ConnectionState>({
    status: "checking",
    message: "Verifying Supabase connectivity...",
  });

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
      // Test querying Supabase authentication or public health
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

  return (
    <div className="relative min-h-screen bg-[#0F172A] text-slate-100 overflow-hidden flex flex-col justify-between">
      {/* Background Decorative Gradient Orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#8E24AA]/25 blur-[120px] animate-pulse-slow" />
      <div className="pointer-events-none absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-[#1E40AF]/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 w-[450px] h-[450px] rounded-full bg-[#0070F3]/15 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-20 right-10 w-80 h-80 rounded-full bg-[#1DB980]/20 blur-[120px]" />

      {/* Top Navigation */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#0F172A]/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-[#8E24AA] via-[#0070F3] to-[#1DB980] p-[2px] shadow-lg shadow-[#0070F3]/25">
              <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#1DB980]" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Six9<span className="text-[#1DB980]">Chat</span>
              </span>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1E40AF]/40 text-[#0070F3] border border-[#0070F3]/30">
                v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/six9chat-web/Six9Chat"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition"
            >
              <span>GitHub Repo</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
            <button
              onClick={checkConnection}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#0070F3] to-[#1DB980] hover:opacity-95 shadow-lg shadow-[#1DB980]/20 transition transform active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Test Ping</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Content Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16 flex-1 flex flex-col items-center">
        {/* Brand Gradient Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 mb-6 shadow-sm">
          <Sparkles className="w-4 h-4 text-[#1DB980]" />
          <span className="text-xs font-medium text-slate-300">
            Next-Gen Real-Time Engine powered by Next.js & Supabase
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-center tracking-tight max-w-4xl leading-[1.15]">
          Experience Seamless{" "}
          <span className="bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] bg-clip-text text-transparent">
            Real-Time Messaging
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 text-center max-w-2xl leading-relaxed">
          Six9Chat delivers lightning-fast, encrypted conversations with real-time
          presence, channels, and modern developer ergonomics.
        </p>

        {/* Live Supabase Connection Indicator Card */}
        <div className="mt-10 w-full max-w-2xl rounded-2xl glow-card p-6 border border-slate-800 bg-[#0F172A]/80 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <Database className="w-5 h-5 text-[#0070F3]" />
              </div>
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  Supabase Live Connection
                </h3>
                <p className="text-xs text-slate-400">Database & Realtime Channel Status</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {connection.status === "checking" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Checking...
                </span>
              )}
              {connection.status === "connected" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1DB980]/15 text-[#1DB980] border border-[#1DB980]/30 shadow-sm shadow-[#1DB980]/10">
                  <span className="w-2 h-2 rounded-full bg-[#1DB980]" />
                  Connected {connection.latencyMs ? `(${connection.latencyMs}ms)` : ""}
                </span>
              )}
              {connection.status === "pending" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0070F3]/15 text-[#0070F3] border border-[#0070F3]/30">
                  <span className="w-2 h-2 rounded-full bg-[#0070F3] animate-pulse" />
                  Config Pending
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
            <p className="font-medium text-slate-200">{connection.message}</p>
            {connection.details && (
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {connection.details}
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Environment file: <code className="text-slate-300">.env.local</code></span>
            <button
              onClick={checkConnection}
              className="inline-flex items-center gap-1.5 text-[#1DB980] hover:text-[#1DB980]/80 transition font-medium"
            >
              <span>Re-check status</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {/* Feature 1 */}
          <div className="glow-card rounded-2xl p-6 bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-[#1DB980]/10 border border-[#1DB980]/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-[#1DB980]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Sync</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sub-millisecond broadcast channels using Supabase WebSocket subscriptions and PostgreSQL change data capture.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glow-card rounded-2xl p-6 bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-[#8E24AA]/10 border border-[#8E24AA]/20 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-[#8E24AA]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Row-Level Security</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Granular PostgreSQL RLS policies ensure private chats, secure group permissions, and tamper-proof user data.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glow-card rounded-2xl p-6 bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-[#0070F3]/10 border border-[#0070F3]/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-[#0070F3]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Presence & Typing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track live online user presence, active typing indicators, and message read receipts across devices.
            </p>
          </div>
        </div>

        {/* Interactive Chat Mockup Card */}
        <div className="mt-16 w-full max-w-3xl rounded-2xl glow-card p-6 bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#1DB980]" />
              <span className="font-semibold text-sm text-white">#general-chat</span>
            </div>
            <span className="text-xs text-slate-400">Live Channel Preview</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8E24AA] to-[#1E40AF] flex items-center justify-center text-xs font-bold text-white">
                JD
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-200">Alex</span>
                  <span className="text-[10px] text-slate-500">18:24</span>
                </div>
                <div className="mt-1 px-4 py-2.5 rounded-2xl rounded-tl-none bg-slate-800/80 text-sm text-slate-200 border border-slate-700/60 max-w-md">
                  Welcome to Six9Chat! Supabase real-time engine is initialized.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 justify-end">
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] text-slate-500">18:25</span>
                  <span className="text-xs font-bold text-[#1DB980]">You</span>
                </div>
                <div className="mt-1 px-4 py-2.5 rounded-2xl rounded-tr-none bg-gradient-to-r from-[#0070F3] to-[#1DB980] text-sm text-white font-medium shadow-md shadow-[#1DB980]/20 max-w-md">
                  Repository linked and brand theme active. Ready for live chat! 🚀
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0070F3] to-[#1DB980] flex items-center justify-center text-xs font-bold text-white">
                ME
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-[#0F172A]/90 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Six9Chat. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1DB980]" />
              Tailwind CSS v4
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8E24AA]" />
              Next.js 16 App Router
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0070F3]" />
              Supabase Realtime
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
