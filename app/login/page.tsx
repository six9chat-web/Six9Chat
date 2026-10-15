"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Fingerprint,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LanguageSelector } from "@/components/auth/LanguageSelector";
import { Language, DEFAULT_LANGUAGE, TRANSLATIONS } from "@/lib/languages";
import { signInWithPasscode, getCurrentUser } from "@/lib/auth";

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="relative min-h-screen w-screen bg-[#053b53] flex flex-col items-center justify-center text-slate-100">
          <div className="w-10 h-10 rounded-full border-2 border-[#97D7FF] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/chat";

  // State
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passcodeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if user is already authenticated on mount
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (user) {
        router.push("/chat");
      }
    }
    checkAuth();
  }, [router]);

  const cleanEmail = email.trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  const passval = passcode.join("");
  const isPasscodeComplete = passval.length === 4;

  // Handle Passcode Digit Change
  const handlePasscodeChange = (index: number, val: string) => {
    const digits = val.replace(/\D/g, "");

    // Handle 4-digit paste into any box
    if (digits.length > 1) {
      const parts = digits.slice(0, 4).split("");
      const next = ["", "", "", ""];
      parts.forEach((d, i) => {
        if (i < 4) next[i] = d;
      });
      setPasscode(next);
      const targetIdx = Math.min(parts.length, 3);
      passcodeInputRefs.current[targetIdx]?.focus();
      return;
    }

    const next = [...passcode];
    next[index] = digits;
    setPasscode(next);

    // Auto-advance
    if (digits && index < 3) {
      passcodeInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePasscodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !passcode[index] && index > 0) {
      passcodeInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasscodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const parts = pasted.split("");
    const next = ["", "", "", ""];
    parts.forEach((d, i) => {
      if (i < 4) next[i] = d;
    });
    setPasscode(next);
    const targetIdx = Math.min(parts.length, 3);
    passcodeInputRefs.current[targetIdx]?.focus();
  };

  // Submit Direct Passcode Auth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!cleanEmail || !isEmailValid) {
      setErrorMessage("Please enter a valid Gmail / Email address.");
      return;
    }

    if (!isPasscodeComplete) {
      setErrorMessage("Please enter your 4-digit passcode.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithPasscode(cleanEmail, passval);
      const assignedUid = result.user?.user_metadata?.uid || "S9-01";

      setSuccessMessage(
        `Welcome to Six9Chat! Assigned UID: ${assignedUid}. Connecting to chat...`
      );

      // Instant redirect straight to the clean chat interface
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 400);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication error. Please try again.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  return (
    <div
      dir={selectedLanguage.direction || "ltr"}
      className="relative min-h-screen w-screen bg-[#053b53] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-[#97D7FF] selection:text-[#086288]"
    >
      {/* Ambient Glow Elements with Deep Ocean & Sky Accents */}
      <div className="h-44 w-full bg-gradient-to-r from-[#086288]/40 via-[#4D8DBA]/30 to-[#97D7FF]/25 absolute top-0 left-0 border-b border-[#4D8DBA]/35 backdrop-blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-[#086288]/40 blur-[160px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-[#4D8DBA]/25 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full bg-[#97D7FF]/20 blur-[150px]" />

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-6 pt-7 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={42} showText={true} />
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onSelect={setSelectedLanguage}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-[#032433]/90 border border-[#4D8DBA]/40 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(3,36,51,0.7)]"
        >
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#086288] border border-[#4D8DBA]/50 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#086288]/40">
              <ShieldCheck className="w-6 h-6 text-[#97D7FF]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Sign In to Six9Chat
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Enter your email and 4-digit passcode for instant access
            </p>
          </div>

          {/* Feedback Alerts */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="leading-snug">{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-snug">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Gmail / Email Input */}
            <div>
              <label
                htmlFor="user-email"
                className="block text-xs font-semibold text-slate-200 mb-1.5"
              >
                Gmail / Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#97D7FF] absolute left-3.5 pointer-events-none" />
                <input
                  id="user-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  disabled={isLoading}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                />
              </div>
            </div>

            {/* 2. 4-Digit Passcode / PIN Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  4-Digit Passcode / PIN
                </label>
                <span className="text-[11px] text-[#97D7FF] font-medium">
                  {isPasscodeComplete ? "4/4 entered" : "Enter 4 digits"}
                </span>
              </div>

              <div className="flex justify-between gap-3 max-w-[280px] mx-auto py-1">
                {passcode.map((digit, idx) => (
                  <input
                    key={`pin-${idx}`}
                    ref={(el) => {
                      passcodeInputRefs.current[idx] = el;
                    }}
                    id={`pin-${idx}`}
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={digit}
                    onChange={(e) => handlePasscodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePasscodeKeyDown(idx, e)}
                    onPaste={handlePasscodePaste}
                    disabled={isLoading}
                    className="w-14 h-14 text-center text-2xl font-bold font-mono bg-[#053b53] border border-[#4D8DBA]/50 rounded-2xl text-[#FFEFC4] focus:outline-none focus:border-[#97D7FF] focus:ring-2 focus:ring-[#97D7FF]/30 transition shadow-inner"
                  />
                ))}
              </div>
            </div>

            {/* System UID Info Badge */}
            <div className="p-3 rounded-2xl bg-[#053b53]/80 border border-[#4D8DBA]/35 text-xs text-slate-300 flex items-center gap-2.5">
              <Fingerprint className="w-4 h-4 text-[#97D7FF] shrink-0" />
              <span className="text-[11px] leading-relaxed">
                Sequential UID (starting from <strong>S9-01</strong>) automatically assigned on login.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isEmailValid || !isPasscodeComplete}
              className="w-full h-12 rounded-xl bg-[#97D7FF] hover:bg-[#b4e3ff] text-[#086288] font-black text-sm active:scale-[0.99] transition shadow-lg shadow-[#086288]/40 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#97D7FF] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#086288]" />
                  <span>Connecting to Six9Chat...</span>
                </>
              ) : (
                <>
                  <span>Enter Six9Chat</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>

      <footer className="relative z-20 py-4 text-center text-xs text-slate-300">
        Six9Chat • Direct Passcode &amp; System UID Architecture
      </footer>
    </div>
  );
}
