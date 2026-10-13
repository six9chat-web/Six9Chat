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
      <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#4D8DBA]/25 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-[#97D7FF]/20 blur-3xl" />

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 rounded-3xl bg-[#086288] backdrop-blur-xl border border-[#4D8DBA]/60 shadow-[0_20px_50px_rgba(8,98,136,0.5)] p-6 sm:p-9 text-slate-100 overflow-hidden">
        {/* Top Brand Logo */}
        <AuthLogo size={58} />

        {/* Six9-Style Tab Switcher */}
        <div className="mt-6 mb-6 p-1.5 rounded-2xl bg-[#053b53] border border-[#4D8DBA]/40 grid grid-cols-2 gap-1 text-xs font-bold">
          {/* Tab 1: Phone OTP */}
          <button
            type="button"
            onClick={() => setActiveTab("phone")}
            className={`relative py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition outline-none cursor-pointer ${
              activeTab === "phone" ? "text-[#086288] font-black" : "text-slate-300 hover:text-white"
            }`}
          >
            {activeTab === "phone" && (
              <motion.div
                layoutId="authCardTabActiveBackground"
                className="absolute inset-0 bg-[#97D7FF] rounded-xl shadow-lg shadow-[#086288]/40"
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
            className={`relative py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition outline-none cursor-pointer ${
              activeTab === "email" ? "text-[#086288] font-black" : "text-slate-300 hover:text-white"
            }`}
          >
            {activeTab === "email" && (
              <motion.div
                layoutId="authCardTabActiveBackground"
                className="absolute inset-0 bg-[#FFEFC4] rounded-xl shadow-lg shadow-[#086288]/40"
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
                    <Smartphone className="w-4 h-4 text-[#97D7FF]" />
                    <span>Six9 Chat Instant OTP Sign In</span>
                  </h3>
                  <p className="text-xs text-slate-200 mt-0.5">
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
                    <Mail className="w-4 h-4 text-[#FFEFC4]" />
                    <span>Email & GitHub OAuth Authentication</span>
                  </h3>
                  <p className="text-xs text-slate-200 mt-0.5">
                    Sign in with your email credentials or sync with GitHub Social.
                  </p>
                </div>
                <EmailAuthForm onSuccess={onSuccess} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Six9 Signature Footer Security Banner */}
        <div className="mt-8 pt-4 border-t border-[#4D8DBA]/35 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#97D7FF]" />
            <span className="text-[11px]">
              End-to-end encrypted · Powered by{" "}
              <strong className="text-white font-semibold">Supabase Auth</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#FFEFC4]" />
              PostgreSQL RLS
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#97D7FF]" />
              Realtime Sync
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
