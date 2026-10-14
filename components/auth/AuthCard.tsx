"use client";

import React from "react";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { PhoneOtpForm } from "@/components/auth/PhoneOtpForm";
import {
  Lock,
  Sparkles,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface AuthCardProps {
  onSuccess?: () => void;
}

export function AuthCard({ onSuccess }: AuthCardProps) {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#4D8DBA]/25 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-[#97D7FF]/20 blur-3xl" />

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 rounded-3xl bg-[#086288] backdrop-blur-xl border border-[#4D8DBA]/60 shadow-[0_20px_50px_rgba(8,98,136,0.5)] p-6 sm:p-9 text-slate-100 overflow-hidden">
        {/* Top Brand Logo */}
        <AuthLogo size={58} />

        {/* WhatsApp-Style Phone Verification Badge */}
        <div className="mt-6 mb-5 p-3 rounded-2xl bg-[#053b53] border border-[#4D8DBA]/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <Smartphone className="w-4 h-4 text-[#97D7FF]" />
            <span>Phone OTP Verification Flow</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[#FFEFC4] bg-[#FFEFC4]/15 px-2 py-0.5 rounded-full border border-[#FFEFC4]/30">
            <ShieldCheck className="w-3 h-3 text-[#FFEFC4]" />
            Official Supabase
          </span>
        </div>

        {/* Phone OTP Form */}
        <div className="relative min-h-[260px]">
          <PhoneOtpForm onSuccess={onSuccess} />
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
