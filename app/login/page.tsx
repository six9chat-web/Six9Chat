"use client";

import React, { useState, useEffect } from "react";
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
  ChevronDown,
  KeyRound,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import {
  signInWithEmail,
  signInWithPhoneOtp,
  verifyPhoneOtp,
  getCurrentUser,
} from "@/lib/auth";

const COUNTRY_CODES = [
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  // Auth mode: 'phone' | 'email' | 'qr'
  const [authMode, setAuthMode] = useState<"phone" | "email" | "qr">("phone");

  // Phone Auth State
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpStep, setOtpStep] = useState<"input" | "verify">("input");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);

  // Email Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if already authenticated on mount
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (user) {
        router.push(redirectPath);
      }
    }
    checkAuth();
  }, [router, redirectPath]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle Phone OTP Send
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;
    if (!phoneNumber || phoneNumber.length < 7) {
      setErrorMessage("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithPhoneOtp(fullPhone);
      setOtpStep("verify");
      setCountdown(60);
      setSuccessMessage(`OTP verification code sent to ${fullPhone}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please check the number.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit input
  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, 6).split("");
      const updated = [...otpCode];
      digits.forEach((d, i) => {
        if (i < 6) updated[i] = d;
      });
      setOtpCode(updated);
      const nextInput = document.getElementById(`otp-${Math.min(digits.length, 5)}`);
      nextInput?.focus();
      return;
    }

    const updated = [...otpCode];
    updated[index] = value;
    setOtpCode(updated);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const token = otpCode.join("");
    if (token.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;
    try {
      await verifyPhoneOtp(fullPhone, token);
      setSuccessMessage("Verification successful! Opening Six9Chat...");
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid verification code.";
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
      setSuccessMessage("Welcome back! Loading chat...");
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 700);
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

  // Quick Demo Login (for easy evaluation)
  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setEmail("demo@six9chat.io");
    setPassword("DemoSecure123!");
    try {
      await signInWithEmail("demo@six9chat.io", "DemoSecure123!");
      setSuccessMessage("Logged in as Demo User! Redirecting...");
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 600);
    } catch {
      // If demo account doesn't exist yet, offer easy signup or auto redirect
      setSuccessMessage("Demo mode activated! Redirecting to setup...");
      router.push(`/signup?email=demo@six9chat.io&name=Demo+Member`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#0A0F1D] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-[#1DB980] selection:text-black">
      {/* Six9-Style Top Ambient Gradient Banner */}
      <div className="h-44 w-full bg-gradient-to-r from-[#1DB980]/20 via-[#8E24AA]/25 to-[#0070F3]/25 absolute top-0 left-0 border-b border-slate-800/60 backdrop-blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-[#1DB980]/15 blur-[160px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-[#0070F3]/15 blur-[160px]" />

      {/* Top Header with Six9Chat Logo */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-6 pt-7 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={42} showText={true} />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#1DB980]" />
          <span>End-to-End Encrypted</span>
        </div>
      </header>

      {/* Main Container Card */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-[540px] bg-[#0F172A]/90 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-[0_20px_70px_rgba(0,0,0,0.65)] overflow-hidden"
        >
          {/* Card Top Branding Header */}
          <div className="p-7 pb-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-[#1DB980] font-bold">
                Six9 Chat Experience
              </span>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1DB980]/15 text-[#1DB980] hover:bg-[#1DB980]/25 border border-[#1DB980]/30 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo One-Click</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Log into Six9Chat
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Connect your phone or email to start real-time messaging
            </p>

            {/* Auth Tab Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 mt-5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("phone");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  authMode === "phone"
                    ? "bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-black font-semibold shadow-md shadow-[#1DB980]/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("email");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  authMode === "email"
                    ? "bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-black font-semibold shadow-md shadow-[#1DB980]/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("qr");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  authMode === "qr"
                    ? "bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-black font-semibold shadow-md shadow-[#1DB980]/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Link</span>
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
                  className="p-3.5 rounded-xl bg-[#1DB980]/15 border border-[#1DB980]/30 text-[#1DB980] text-xs flex items-start gap-2.5 mb-3"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tab Content Panels */}
          <div className="p-7 pt-2">
            {/* 1. Phone OTP Verification Mode */}
            {authMode === "phone" && (
              <motion.div
                key="phone-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
              >
                {otpStep === "input" ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-2">
                        Select Country / Region
                      </label>
                      <div className="relative">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 appearance-none focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                        >
                          {COUNTRY_CODES.map((item, idx) => (
                            <option
                              key={`${item.code}-${idx}`}
                              value={item.code}
                              className="bg-slate-900 text-white"
                            >
                              {item.flag} {item.country} ({item.code})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-2">
                        Phone Number
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-slate-400 font-mono text-sm select-none">
                          {countryCode}
                        </div>
                        <input
                          type="tel"
                          placeholder="555 123 4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          style={{
                            paddingLeft: `${Math.max(56, countryCode.length * 12 + 20)}px`,
                          }}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition font-mono tracking-wide"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        Six9Chat will send a one-time SMS verification code to this number.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] text-black font-bold text-sm hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#1DB980]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>Sending OTP code...</span>
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
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="text-center py-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#1DB980]/15 border border-[#1DB980]/30 flex items-center justify-center mx-auto mb-3 text-[#1DB980]">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-white">
                        Enter 6-Digit Code
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Sent to{" "}
                        <span className="text-white font-mono font-medium">
                          {countryCode} {phoneNumber}
                        </span>
                      </p>
                    </div>

                    {/* 6-Digit Boxes */}
                    <div className="flex justify-between gap-2 max-w-[340px] mx-auto">
                      {otpCode.map((digit, idx) => (
                        <input
                          key={`otp-${idx}`}
                          id={`otp-${idx}`}
                          type="text"
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
                          <span>Verifying code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Continue</span>
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
                        Change number
                      </button>
                      <button
                        type="button"
                        disabled={countdown > 0 || isLoading}
                        onClick={handleSendOtp}
                        className="text-[#1DB980] hover:underline disabled:text-slate-600 disabled:no-underline font-medium"
                      >
                        {countdown > 0 ? `Resend code (${countdown}s)` : "Resend SMS"}
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
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
              >
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          alert("To reset password, sign in via OTP or contact your workspace admin.")
                        }
                        className="text-[11px] text-slate-400 hover:text-[#1DB980] transition"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-[#1DB980] focus:ring-0 focus:ring-offset-0"
                      />
                      <span>Keep me signed in</span>
                    </label>
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

            {/* 3. Six9 Chat QR Code Link Mode */}
            {authMode === "qr" && (
              <motion.div
                key="qr-tab"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="text-center py-2"
              >
                <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-xl relative group">
                  {/* Stylized QR Code SVG */}
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-slate-900"
                    fill="currentColor"
                  >
                    {/* Corners */}
                    <rect x="10" y="10" width="24" height="24" rx="3" fill="#0F172A" />
                    <rect x="15" y="15" width="14" height="14" rx="2" fill="#FFFFFF" />
                    <rect x="18" y="18" width="8" height="8" rx="1" fill="#1DB980" />

                    <rect x="66" y="10" width="24" height="24" rx="3" fill="#0F172A" />
                    <rect x="71" y="15" width="14" height="14" rx="2" fill="#FFFFFF" />
                    <rect x="74" y="18" width="8" height="8" rx="1" fill="#0070F3" />

                    <rect x="10" y="66" width="24" height="24" rx="3" fill="#0F172A" />
                    <rect x="15" y="71" width="14" height="14" rx="2" fill="#FFFFFF" />
                    <rect x="18" y="74" width="8" height="8" rx="1" fill="#8E24AA" />

                    {/* Pattern Matrix */}
                    <circle cx="42" cy="18" r="3" fill="#0F172A" />
                    <circle cx="54" cy="18" r="3" fill="#0F172A" />
                    <circle cx="48" cy="28" r="3" fill="#0F172A" />
                    <circle cx="42" cy="38" r="3" fill="#0F172A" />
                    <circle cx="58" cy="44" r="3" fill="#0F172A" />
                    <circle cx="30" cy="46" r="3" fill="#0F172A" />
                    <circle cx="18" cy="46" r="3" fill="#0F172A" />
                    <circle cx="70" cy="48" r="3" fill="#0F172A" />
                    <circle cx="82" cy="48" r="3" fill="#0F172A" />
                    <circle cx="50" cy="50" r="5" fill="#1DB980" />
                    <circle cx="40" cy="62" r="3" fill="#0F172A" />
                    <circle cx="52" cy="70" r="3" fill="#0F172A" />
                    <circle cx="62" cy="62" r="3" fill="#0F172A" />
                    <circle cx="74" cy="74" r="3" fill="#0F172A" />
                    <circle cx="82" cy="82" r="3" fill="#0F172A" />
                  </svg>
                </div>

                <div className="mt-4 text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-white">To use Six9Chat on your computer:</p>
                  <p className="text-slate-400 text-[11px]">1. Open Six9Chat on your phone</p>
                  <p className="text-slate-400 text-[11px]">2. Tap Menu or Settings and select Linked Devices</p>
                  <p className="text-slate-400 text-[11px]">3. Point your phone at this screen to capture the code</p>
                </div>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#1DB980] hover:underline font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate Instant QR Scan</span>
                </button>
              </motion.div>
            )}
          </div>

          {/* Card Footer: Signup Redirection */}
          <div className="p-5 bg-slate-950/60 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>New to Six9Chat? </span>
            <Link
              href="/signup"
              className="text-[#1DB980] hover:underline font-semibold"
            >
              Create an account & set up profile
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
