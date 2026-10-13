"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { PhoneOtpForm } from "@/components/auth/PhoneOtpForm";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import {
  Phone,
  Mail,
  Shield,
  Lock,
  Sparkles,
  QrCode,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

interface AuthCardProps {
  onSuccess?: () => void;
}

export type AuthTab = "phone" | "email";

export function AuthCard({ onSuccess }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>("phone");

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#1DB980]/20 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-[#0070F3]/20 blur-3xl" />

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 sm:p-9 text-slate-100 overflow-hidden">
        {/* Top Brand Logo */}
        <AuthLogo size={58} />

        {/* Six9-Style Tab Switcher */}
        <div className="mt-6 mb-6 p-1.5 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 gap-1 text-xs font-bold">
          {/* Tab 1: Phone OTP */}
          <button
            type="button"
            onClick={() => setActiveTab("phone")}
            className={`relative py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition outline-none ${
              activeTab === "phone" ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {activeTab === "phone" && (
              <motion.div
                layoutId="authCardTabActiveBackground"
                className="absolute inset-0 bg-gradient-to-r from-[#1DB980] to-[#0070F3] rounded-xl shadow-lg shadow-emerald-500/20"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Phone className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10 truncate">Phone Number (OTP)</span>
          </button>

          {/* Tab 2: Email / Password / Social */}
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`relative py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition outline-none ${
              activeTab === "email" ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {activeTab === "email" && (
              <motion.div
                layoutId="authCardTabActiveBackground"
                className="absolute inset-0 bg-gradient-to-r from-[#0070F3] to-[#8E24AA] rounded-xl shadow-lg shadow-blue-500/20"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Mail className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10 truncate">Email & Social</span>
          </button>
        </div>

        {/* Tab Content with Framer Motion Animation */}
        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {activeTab === "phone" ? (
              <motion.div
                key="tab_phone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#1DB980]" />
                    <span>Six9 Chat Instant OTP Sign In</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter your mobile number to receive a 6-digit confirmation PIN.
                  </p>
                </div>
                <PhoneOtpForm onSuccess={onSuccess} />
              </motion.div>
            ) : (
              <motion.div
                key="tab_email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#0070F3]" />
                    <span>Email & GitHub OAuth Authentication</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sign in with your email credentials or sync with GitHub Social.
                  </p>
                </div>
                <EmailAuthForm onSuccess={onSuccess} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Six9 Signature Footer Security Banner */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#1DB980]" />
            <span className="text-[11px]">
              End-to-end encrypted · Powered by{" "}
              <strong className="text-slate-300 font-semibold">Supabase Auth</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#1DB980]" />
              PostgreSQL RLS
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0070F3]" />
              Realtime Sync
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
