"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  QrCode,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CountryCodeSelector } from "@/components/auth/CountryCodeSelector";
import { Country, DEFAULT_COUNTRY } from "@/lib/countries";
import {
  signInWithEmail,
  signInWithPhoneOtp,
  verifyPhoneOtp,
  getCurrentUser,
} from "@/lib/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/chat";

  // Toggle options: 'phone' (Default) | 'email' | 'qr'
  const [authMode, setAuthMode] = useState<"phone" | "email" | "qr">("phone");

  // Phone Auth State
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpStep, setOtpStep] = useState<"input" | "verify">("input");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if already authenticated on mount
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (user) {
        router.push("/chat");
      }
    }
    checkAuth();
  }, [router]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first OTP input when switching to verify step
  useEffect(() => {
    if (otpStep === "verify") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [otpStep]);

  // Format full phone number
  const cleanDigits = phoneNumber.replace(/\D/g, "");
  const fullPhone = `${selectedCountry.dial_code}${cleanDigits}`;

  // Handle Phone OTP Send
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (cleanDigits.length < 7) {
      setErrorMessage("Please enter a valid phone number (minimum 7 digits).");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithPhoneOtp(fullPhone);
      setOtpStep("verify");
      setCountdown(60);
      setSuccessMessage(`Verification code sent to ${fullPhone}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to send verification code. Please check the phone number.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit input with smooth auto-focus between digits
  const handleOtpDigitChange = (index: number, value: string) => {
    const numericVal = value.replace(/\D/g, "");

    // Handle full paste (e.g. 6-digit code)
    if (numericVal.length > 1) {
      const digits = numericVal.slice(0, 6).split("");
      const updated = [...otpCode];
      digits.forEach((d, i) => {
        if (i < 6) updated[i] = d;
      });
      setOtpCode(updated);
      const nextIdx = Math.min(digits.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const updated = [...otpCode];
    updated[index] = numericVal;
    setOtpCode(updated);

    if (numericVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const token = otpCode.join("");
    if (token.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      await verifyPhoneOtp(fullPhone, token);
      setSuccessMessage("Verification successful! Opening Six9Chat...");
      setTimeout(() => {
        router.push("/chat");
        router.refresh();
      }, 600);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid verification code. Please check and try again.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email / Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      setSuccessMessage("Welcome back to Six9Chat! Loading your chats...");
      setTimeout(() => {
        router.push("/chat");
        router.refresh();
      }, 600);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Login
  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setEmail("demo@six9chat.io");
    setPassword("DemoSecure123!");
    try {
      await signInWithEmail("demo@six9chat.io", "DemoSecure123!");
      setSuccessMessage("Logged in as Demo Member! Launching chat...");
      setTimeout(() => {
        router.push("/chat");
        router.refresh();
      }, 500);
    } catch {
      setSuccessMessage("Demo account redirecting to instant setup...");
      router.push(`/signup?email=demo@six9chat.io&name=Demo+Member`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#0A0F1D] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-[#1DB980] selection:text-black">
      {/* Ambient Glow Elements with Emerald-Purple-Royal Blue Gradients */}
      <div className="h-44 w-full bg-gradient-to-r from-[#1DB980]/20 via-[#8E24AA]/25 to-[#0070F3]/25 absolute top-0 left-0 border-b border-slate-800/60 backdrop-blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-[#1DB980]/15 blur-[160px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-[#0070F3]/15 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full bg-[#8E24AA]/15 blur-[150px]" />

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-6 pt-7 pb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={42} showText={true} />
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#1DB980]" />
          <span>End-to-End Encrypted</span>
        </div>
      </header>

      {/* Main Centered Glassmorphic Container Card */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-[540px] bg-[#0F172A]/90 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-[0_20px_70px_rgba(0,0,0,0.65)] overflow-hidden"
        >
          {/* Card Top Branding Header with S9 Circular Ribbon Logo */}
          <div className="p-7 pb-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent text-center">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-[#1DB980] font-bold">
                SIX9 CHAT PROFILE SETUP
              </span>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1DB980]/15 text-[#1DB980] hover:bg-[#1DB980]/25 border border-[#1DB980]/30 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo 1-Click</span>
              </button>
            </div>

            {/* S9 Circular Ribbon Logo */}
            <div className="flex justify-center mb-3">
              <Logo size={60} showText={false} />
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              Log into Six9Chat
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              To use Six9Chat on your browser, connect your phone or email credentials
            </p>

            {/* Toggle Options: Log in with Phone Number (Default) vs Log in with Email/Password */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 mt-5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("phone");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  authMode === "phone"
                    ? "bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-black font-bold shadow-md shadow-[#1DB980]/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Log in with Phone</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("email");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  authMode === "email"
                    ? "bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-black font-bold shadow-md shadow-[#1DB980]/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Log in with Email</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          <div className="px-7 pt-4">
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 mb-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{errorMessage}</span>
                </motion.div>
              )}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 mb-3"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Form Tabs Content */}
          <div className="p-7 pt-2">
            {/* 1. Phone Number Auth Mode (Default) */}
            {authMode === "phone" && (
              <motion.div
                key="phone-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {otpStep === "input" ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Select Country & Enter Phone Number
                      </label>
                      <div className="flex items-center gap-2">
                        {/* Searchable Country Dropdown with Flags and Dial Codes */}
                        <CountryCodeSelector
                          selectedCountry={selectedCountry}
                          onSelect={setSelectedCountry}
                          disabled={isLoading}
                        />
                        <div className="relative flex-1">
                          <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            placeholder="300 1234567"
                            value={phoneNumber}
                            onChange={(e) =>
                              setPhoneNumber(e.target.value.replace(/[^\d\s-]/g, ""))
                            }
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition font-mono tracking-wide"
                            required
                          />
                        </div>
                      </div>

                      {cleanDigits && (
                        <p className="text-[11px] text-slate-400 mt-1.5 pl-0.5 flex items-center gap-1.5">
                          <span className="text-slate-500">Destination:</span>
                          <span className="font-mono text-[#1DB980] font-semibold">
                            {selectedCountry.dial_code} {cleanDigits}
                          </span>
                        </p>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Six9Chat will send a one-time 6-digit SMS verification code to your device. Carrier SMS rates may apply.
                    </p>

                    <button
                      type="submit"
                      disabled={isLoading || cleanDigits.length < 7}
                      className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] text-black font-bold text-sm hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#1DB980]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>Sending Verification Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* OTP Verification Screen: 6 separate digital input boxes */
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="text-center py-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#1DB980]/15 border border-[#1DB980]/30 flex items-center justify-center mx-auto mb-3 text-[#1DB980]">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-white">
                        Enter 6-Digit Verification Code
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        We sent a code to{" "}
                        <span className="text-emerald-400 font-mono font-medium">
                          {fullPhone}
                        </span>
                      </p>
                    </div>

                    {/* 6 Separate Digital Input Boxes with Auto-Focus */}
                    <div className="flex justify-between gap-2 max-w-[340px] mx-auto">
                      {otpCode.map((digit, idx) => (
                        <input
                          key={`otp-${idx}`}
                          ref={(el) => {
                            otpInputRefs.current[idx] = el;
                          }}
                          id={`otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-12 h-14 text-center text-xl font-bold font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#1DB980] focus:ring-2 focus:ring-[#1DB980]/30 transition"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || otpCode.join("").length < 6}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-black font-bold text-sm hover:opacity-95 transition shadow-lg shadow-[#1DB980]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Launch Six9Chat</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep("input");
                          setOtpCode(["", "", "", "", "", ""]);
                        }}
                        className="hover:text-white transition"
                      >
                        ← Change number
                      </button>
                      <button
                        type="button"
                        disabled={countdown > 0 || isLoading}
                        onClick={handleSendOtp}
                        className="text-[#1DB980] hover:underline disabled:text-slate-600 disabled:no-underline font-medium"
                      >
                        {countdown > 0 ? `Resend code in ${countdown}s` : "Resend Code"}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* 2. Email & Password Mode */}
            {authMode === "email" && (
              <motion.div
                key="email-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="member@six9chat.io"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Password
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Min 6 characters
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] text-black font-bold text-sm hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#1DB980]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Six9Chat</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </div>

          {/* Card Footer: Link to Signup */}
          <div className="p-5 bg-slate-950/60 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>New to Six9Chat? </span>
            <Link
              href="/signup"
              className="text-[#1DB980] hover:underline font-semibold"
            >
              Create an account
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-20 py-4 text-center text-xs text-slate-500">
        Six9Chat • Next.js 16 & Supabase Auth Architecture • End-to-End Encrypted
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="relative min-h-screen w-screen bg-[#0A0F1D] flex flex-col items-center justify-center text-slate-100">
          <div className="w-10 h-10 rounded-full border-2 border-[#1DB980] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}
