"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { ProfileOnboardingModal } from "@/components/auth/ProfileOnboardingModal";
import { Logo } from "@/components/ui/Logo";
import {
  Smartphone,
  ShieldCheck,
  Zap,
  Lock,
  Globe,
  Radio,
  ExternalLink,
  MessageSquare,
  QrCode,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const { isAuthenticated, isLoading, needsOnboarding, setNeedsOnboarding } = useAuth();
  const router = useRouter();

  // If already authenticated and doesn't need onboarding, redirect to chat home
  useEffect(() => {
    if (!isLoading && isAuthenticated && !needsOnboarding) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, needsOnboarding, router]);

  const handleAuthSuccess = () => {
    if (!needsOnboarding) {
      router.push("/");
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0A0F1D] text-slate-100 flex flex-col font-sans selection:bg-[#1DB980] selection:text-black overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#1DB980]/15 blur-[160px] animate-pulse-glow" />
      <div className="pointer-events-none fixed top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-[#0070F3]/20 blur-[170px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-[#8E24AA]/15 blur-[160px]" />

      {/* Top Navigation Bar */}
      <header className="relative z-30 w-full h-16 px-6 sm:px-10 border-b border-slate-800/80 bg-[#0B132B]/80 backdrop-blur-xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Logo size={32} showText={true} />
          <div className="hidden sm:block h-4 w-px bg-slate-800" />
          <span className="hidden sm:inline text-xs text-slate-400 font-medium">
            Six9 Chat Authentication Architecture
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-[#1DB980] animate-pulse" />
            <span>Supabase Auth: Active</span>
          </div>

          <a
            href="https://supabase.com/docs/guides/auth"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition font-medium"
          >
            <span>Auth Docs</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#1DB980]" />
          </a>
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Six9 Chat Pairing Instructions & Brand Showcase */}
          <div className="lg:col-span-5 space-y-6 text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#1DB980] shadow-[0_0_8px_#1DB980]" />
              <span>Six9 Chat Realtime Engine</span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Use Six9Chat on your browser with{" "}
                <span className="text-gradient-brand">Supabase Auth</span>
              </h2>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Connect seamlessly using Phone SMS OTP, Email credentials, or GitHub
                OAuth. Fast, persistent sessions secured by PostgreSQL Row-Level
                Security.
              </p>
            </div>

            {/* Step-by-Step Six9 Chat Onboarding Steps */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[#1DB980] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Choose Authentication Mode
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select Phone OTP for Six9 Chat SMS flow or Email/OAuth for quick social
                    access.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-[#0070F3] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Verify 6-Digit SMS PIN
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Instant token verification dispatched directly via Supabase Auth
                    providers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[#8E24AA] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Sync Profile & Live Channels
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose your display avatar and jump right into the dual-pane
                    real-time chat.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Spec Pills */}
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#1DB980]" />
                AES-256 Encrypted
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#0070F3]" />
                Sub-15ms Latency
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#8E24AA]" />
                Global Edge CDN
              </span>
            </div>
          </div>

          {/* Right Column: The Interactive Glassmorphic Auth Card */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <AuthCard onSuccess={handleAuthSuccess} />
          </div>
        </div>
      </main>

      {/* User Profile Onboarding Modal (Appears after sign up / incomplete profile) */}
      <ProfileOnboardingModal
        isOpen={needsOnboarding}
        onComplete={() => {
          setNeedsOnboarding(false);
          router.push("/");
        }}
      />
    </div>
  );
}
