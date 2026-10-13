"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Camera,
  Check,
  User,
  MessageSquare,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CountryCodeSelector } from "@/components/auth/CountryCodeSelector";
import { LanguageSelector } from "@/components/auth/LanguageSelector";
import { Country, DEFAULT_COUNTRY } from "@/lib/countries";
import { Language, DEFAULT_LANGUAGE, TRANSLATIONS } from "@/lib/languages";
import {
  signInWithPhoneOtp,
  verifyPhoneOtp,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  ensureProfileExists,
  uploadAvatar,
} from "@/lib/auth";

const AVATAR_PRESETS = [
  { id: "grad-emerald", label: "Emerald", gradient: "from-[#1DB980] to-[#047857]" },
  { id: "grad-purple", label: "Purple", gradient: "from-[#8E24AA] to-[#4A148C]" },
  { id: "grad-cyan", label: "Cyan", gradient: "from-[#0070F3] to-[#0369A1]" },
  { id: "grad-sunset", label: "Sunset", gradient: "from-[#F59E0B] to-[#D97706]" },
  { id: "grad-rose", label: "Rose", gradient: "from-[#F43F5E] to-[#BE123C]" },
  { id: "grad-indigo", label: "Indigo", gradient: "from-[#6366F1] to-[#3730A3]" },
];

const STATUS_PRESETS = [
  "Hey there! I am using Six9Chat",
  "Available",
  "Busy",
  "At work",
  "In a meeting",
  "Battery about to die",
  "Urgent calls only",
  "Coding the future 💻",
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/chat";

  // Multi-step WhatsApp Flow:
  // 1 = Language Selection
  // 2 = Country & Phone Input
  // 3 = 6-Digit OTP Verification
  // 4 = Profile Setup (New or Returning User)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Language
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  // Step 2: Country & Phone
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Step 3: OTP
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 4: Profile Setup
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [statusText, setStatusText] = useState("Hey there! I am using Six9Chat");
  const [selectedPresetAvatar, setSelectedPresetAvatar] = useState(AVATAR_PRESETS[0].id);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const t = TRANSLATIONS[selectedLanguage.code] || TRANSLATIONS.en;

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

  // Resend OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first OTP digit when entering Step 3
  useEffect(() => {
    if (step === 3) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Clean formatted phone
  const cleanDigits = phoneNumber.replace(/\D/g, "");
  const fullPhone = `${selectedCountry.dial_code}${cleanDigits}`;

  // STEP 1 -> STEP 2
  const handleProceedFromLanguage = () => {
    setStep(2);
  };

  // STEP 2: Send OTP
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
      setStep(3);
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

  // STEP 3: Handle OTP Digit Input Traversal
  const handleOtpDigitChange = (index: number, value: string) => {
    const numericVal = value.replace(/\D/g, "");

    // Handle full paste
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

  // STEP 3: Verify OTP & Detect Profile
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
      const result = await verifyPhoneOtp(fullPhone, token);
      const userId = result.user?.id;

      if (!userId) {
        throw new Error("User verification failed. Please try again.");
      }

      setAuthenticatedUserId(userId);
      setSuccessMessage("Code verified successfully!");

      // Query Supabase profiles table for existing user details
      try {
        const existingProfile = await getUserProfile(userId);
        if (existingProfile && (existingProfile.full_name || existingProfile.avatar_url)) {
          // Returning User Detected: Pre-fill all fields
          setIsExistingUser(true);
          if (existingProfile.full_name) setDisplayName(existingProfile.full_name);
          if (existingProfile.status) setStatusText(existingProfile.status);
          if (existingProfile.avatar_url) setCustomAvatarUrl(existingProfile.avatar_url);
        } else {
          // New User
          setIsExistingUser(false);
          setDisplayName("");
          setStatusText("Hey there! I am using Six9Chat");
        }
      } catch (profileErr) {
        console.warn("Profile fetch note:", profileErr);
        setIsExistingUser(false);
      }

      // Transition to Step 4: Profile Setup
      setStep(4);
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

  // STEP 4: Custom Avatar File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCustomAvatarUrl(previewUrl);
    }
  };

  // STEP 4: Finish Profile Setup & Redirect to /chat
  const handleFinishProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const finalName = displayName.trim() || "Six9Chat Member";
    setIsLoading(true);

    try {
      let finalAvatarUrl = customAvatarUrl || "";

      // Upload custom avatar if file was selected
      if (authenticatedUserId && avatarFile) {
        try {
          const uploaded = await uploadAvatar(authenticatedUserId, avatarFile);
          finalAvatarUrl = uploaded;
        } catch (uploadErr) {
          console.warn("Avatar upload fallback:", uploadErr);
        }
      }

      // Sync/Upsert profile to Supabase public.profiles table
      if (authenticatedUserId) {
        await ensureProfileExists({
          id: authenticatedUserId,
          full_name: finalName,
          avatar_url: finalAvatarUrl,
          phone: fullPhone,
          status: statusText,
        });

        await updateUserProfile(authenticatedUserId, {
          full_name: finalName,
          avatar_url: finalAvatarUrl,
          phone: fullPhone,
          status: statusText,
        });
      }

      setSuccessMessage("Setting up your chat experience...");
      setTimeout(() => {
        router.push("/chat");
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save profile. Proceeding to chat...";
      setErrorMessage(message);
      setTimeout(() => {
        router.push("/chat");
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  const initials = (displayName || "S9")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      dir={selectedLanguage.direction || "ltr"}
      className="relative min-h-screen w-screen bg-[#0A0F1D] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-[#1DB980] selection:text-black"
    >
      {/* Ambient Glow Elements with Emerald-Purple-Royal Blue Gradients */}
      <div className="h-44 w-full bg-gradient-to-r from-[#1DB980]/20 via-[#8E24AA]/25 to-[#0070F3]/25 absolute top-0 left-0 border-b border-slate-800/60 backdrop-blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-[#1DB980]/15 blur-[160px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-[#0070F3]/15 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full bg-[#8E24AA]/15 blur-[150px]" />

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-6 pt-7 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={42} showText={true} />
        </div>
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
          className="w-full max-w-[500px] bg-[#0F172A]/90 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-[0_20px_70px_rgba(0,0,0,0.65)] overflow-hidden"
        >
          {/* Card Top Branding Header with S9 Circular Ribbon Logo */}
          <div className="p-7 pb-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent text-center">
            {/* Step Navigation Pill */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-[#1DB980] font-bold">
                SIX9 CHAT
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Step {step} of 4
              </span>
            </div>

            {/* S9 Circular Ribbon Logo */}
            <div className="flex justify-center mb-3">
              <Logo size={60} showText={false} />
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center gap-1.5 max-w-[200px] mx-auto mt-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                    step >= s
                      ? "bg-gradient-to-r from-[#1DB980] to-[#0070F3]"
                      : "bg-slate-800"
                  }`}
                />
              ))}
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

          {/* Multi-Step Forms */}
          <div className="p-7 pt-2">
            <AnimatePresence mode="wait">
              {/* ========================================================================= */}
              {/* STEP 1: LANGUAGE SELECTION SCREEN */}
              {/* ========================================================================= */}
              {step === 1 && (
                <motion.div
                  key="step-1-language"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 text-center"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {t.welcome}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
                      {t.selectLanguage}
                    </p>
                  </div>

                  {/* Multi-language Dropdown with Flags */}
                  <div className="text-left pt-1">
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Language / زبان / لغة
                    </label>
                    <LanguageSelector
                      selectedLanguage={selectedLanguage}
                      onSelect={setSelectedLanguage}
                    />
                  </div>

                  {/* WhatsApp-Style Terms Notice */}
                  <p className="text-[11px] text-slate-400 leading-relaxed px-2">
                    Read our{" "}
                    <span className="text-[#1DB980] hover:underline cursor-pointer">
                      Privacy Policy
                    </span>
                    . Tap &quot;Agree and continue&quot; to accept the{" "}
                    <span className="text-[#1DB980] hover:underline cursor-pointer">
                      Terms of Service
                    </span>
                    .
                  </p>

                  {/* Next / Continue CTA Button */}
                  <button
                    type="button"
                    onClick={handleProceedFromLanguage}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] text-black font-extrabold text-sm hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#1DB980]/25 flex items-center justify-center gap-2"
                  >
                    <span>{t.next}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: COUNTRY SELECTOR & PHONE NUMBER INPUT */}
              {/* ========================================================================= */}
              {step === 2 && (
                <motion.form
                  key="step-2-phone"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSendOtp}
                  className="space-y-5"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {t.enterPhone}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
                      Six9Chat will need to verify your phone number. Carrier SMS charges may apply.
                    </p>
                  </div>

                  {/* Country Selector: Full-Width list with flags and dial codes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      {t.chooseCountry}
                    </label>
                    <CountryCodeSelector
                      selectedCountry={selectedCountry}
                      onSelect={setSelectedCountry}
                      variant="full"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Dynamically Prefixed Phone Number Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Phone Number
                    </label>
                    <div className="flex items-center gap-2">
                      {/* Fixed Dial Code Box */}
                      <div className="h-12 px-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-sm font-mono text-[#1DB980] font-bold select-none shrink-0">
                        {selectedCountry.dial_code}
                      </div>

                      {/* Number Input Field */}
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          placeholder="300 1234567"
                          value={phoneNumber}
                          onChange={(e) =>
                            setPhoneNumber(e.target.value.replace(/[^\d\s-]/g, ""))
                          }
                          className="w-full h-12 bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition font-mono tracking-wider"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    {cleanDigits && (
                      <p className="text-[11px] text-slate-400 mt-1.5 pl-0.5 flex items-center gap-1.5">
                        <span className="text-slate-500">Full Number:</span>
                        <span className="font-mono text-[#1DB980] font-semibold">
                          {selectedCountry.dial_code} {cleanDigits}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Buttons: Back to Language & Next */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="py-3.5 px-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || cleanDigits.length < 7}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] text-black font-extrabold text-sm hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#1DB980]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>Sending code...</span>
                        </>
                      ) : (
                        <>
                          <span>{t.next}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: 6-DIGIT OTP VERIFICATION SCREEN */}
              {/* ========================================================================= */}
              {step === 3 && (
                <motion.form
                  key="step-3-otp"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#1DB980]/15 border border-[#1DB980]/30 flex items-center justify-center mx-auto mb-3 text-[#1DB980]">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {t.verifyPhone}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the 6-digit code sent to{" "}
                      <span className="text-emerald-400 font-mono font-medium">
                        {fullPhone}
                      </span>
                    </p>
                  </div>

                  {/* 6 Individual Digital Input Boxes with Auto-Focus */}
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
                        className="w-12 h-14 text-center text-2xl font-bold font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#1DB980] focus:ring-2 focus:ring-[#1DB980]/30 transition"
                      />
                    ))}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || otpCode.join("").length < 6}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-black font-extrabold text-sm hover:opacity-95 transition shadow-lg shadow-[#1DB980]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Footer Links: Wrong number? + Resend Code Timer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(2);
                        setOtpCode(["", "", "", "", "", ""]);
                      }}
                      className="hover:text-white transition"
                    >
                      ← Edit number
                    </button>
                    <button
                      type="button"
                      disabled={countdown > 0 || isLoading}
                      onClick={handleSendOtp}
                      className="text-[#1DB980] hover:underline disabled:text-slate-600 disabled:no-underline font-medium"
                    >
                      {countdown > 0 ? `${t.resendCode} in ${countdown}s` : t.resendCode}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ========================================================================= */}
              {/* STEP 4: PROFILE SETUP & EXISTING USER AUTO-DETECTION */}
              {/* ========================================================================= */}
              {step === 4 && (
                <motion.form
                  key="step-4-profile"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleFinishProfile}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {isExistingUser ? t.welcomeBack : t.profileInfo}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                      {isExistingUser
                        ? "Confirm or update your profile details"
                        : "Please provide your name and an optional profile picture"}
                    </p>
                  </div>

                  {/* Interactive Circular Profile Avatar Picture Uploader */}
                  <div className="flex flex-col items-center justify-center pt-1">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload profile picture"
                    >
                      <div
                        className={`w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-2xl ring-4 ring-[#1DB980]/40 transition-transform group-hover:scale-105 overflow-hidden ${
                          customAvatarUrl
                            ? "bg-slate-800"
                            : `bg-gradient-to-tr ${
                                AVATAR_PRESETS.find((p) => p.id === selectedPresetAvatar)?.gradient ||
                                "from-[#1DB980] to-[#0070F3]"
                              }`
                        }`}
                      >
                        {customAvatarUrl ? (
                          <img
                            src={customAvatarUrl}
                            alt="Profile Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>

                      {/* Floating Camera Badge */}
                      <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#1DB980] text-black flex items-center justify-center shadow-lg border-2 border-[#0F172A] group-hover:bg-[#159a68] group-hover:scale-110 transition">
                        <Camera className="w-4.5 h-4.5" />
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <p className="text-xs text-slate-400 mt-2.5 text-center">
                      Tap camera to choose picture
                    </p>

                    {/* Palette Presets Chips */}
                    <div className="flex items-center gap-2 mt-2">
                      {AVATAR_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSelectedPresetAvatar(preset.id);
                            setCustomAvatarUrl(null);
                          }}
                          className={`w-6 h-6 rounded-full bg-gradient-to-tr ${preset.gradient} transition-transform ${
                            selectedPresetAvatar === preset.id && !customAvatarUrl
                              ? "scale-125 ring-2 ring-white"
                              : "hover:scale-110 opacity-70"
                          }`}
                          title={preset.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Display Name Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      {t.typeName}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                        required
                        maxLength={50}
                        autoFocus
                      />
                    </div>
                    {/* WhatsApp-identical disclaimer */}
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      This is not your username or pin. This name will be visible to your Six9Chat contacts.
                    </p>
                  </div>

                  {/* Bio / Status Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      {t.about}
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Hey there! I am using Six9Chat"
                        value={statusText}
                        onChange={(e) => setStatusText(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                        maxLength={120}
                      />
                    </div>

                    {/* Status Presets Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {STATUS_PRESETS.slice(0, 4).map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setStatusText(preset)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                            statusText === preset
                              ? "bg-[#1DB980]/20 border-[#1DB980] text-[#1DB980] font-medium"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Finish Setup CTA Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !displayName.trim()}
                    className="w-full py-3.5 px-5 rounded-xl bg-[#1DB980] hover:bg-[#159a68] text-black font-extrabold text-sm transition shadow-lg shadow-[#1DB980]/30 flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4.5 h-4.5 animate-spin text-black" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>{t.finishSetup}</span>
                        <div className="w-5 h-5 rounded-full bg-black/15 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                        </div>
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
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
