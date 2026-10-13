"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Phone,
  Camera,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  AtSign,
  MessageSquare,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import {
  signUpWithEmail,
  uploadAvatar,
  ensureProfileExists,
} from "@/lib/auth";
import { Country, DEFAULT_COUNTRY } from "@/lib/countries";
import { CountryCodeSelector } from "@/components/auth/CountryCodeSelector";

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

export default function SignupPage() {
  const router = useRouter();

  // Current Step: 1 = Credentials, 2 = Profile Setup
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Credentials
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Profile Customization
  const [username, setUsername] = useState("");
  const [statusText, setStatusText] = useState("Hey there! I am using Six9Chat");
  const [selectedPresetAvatar, setSelectedPresetAvatar] = useState(AVATAR_PRESETS[0].id);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-generate suggested username when Full Name or Email changes
  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (!username || username.startsWith("user_")) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 15);
      if (generated) setUsername(generated);
    }
  };

  // Step 1 Validation
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage("Please enter your display name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (!username) {
      setUsername(fullName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || "user");
    }

    setStep(2);
  };

  // Handle Custom Avatar File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCustomAvatarUrl(previewUrl);
    }
  };

  // Step 2 Final Submission
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      let finalAvatarUrl = customAvatarUrl || "";

      // Format full international phone number if provided
      let fullPhone = "";
      if (phone.trim()) {
        if (phone.trim().startsWith("+")) {
          fullPhone = phone.trim();
        } else {
          const cleanDigits = phone.replace(/\D/g, "");
          fullPhone = cleanDigits ? `${selectedCountry.dial_code}${cleanDigits}` : "";
        }
      }

      // 1. Register user with Supabase Auth
      const authResult = await signUpWithEmail({
        email,
        password,
        fullName,
        username,
        phone: fullPhone,
        avatarUrl: finalAvatarUrl,
        status: statusText,
      });

      const userId = authResult.user?.id;

      // 2. If user uploaded a custom file and user ID exists, upload to Supabase storage
      if (userId && avatarFile) {
        try {
          const uploadedUrl = await uploadAvatar(userId, avatarFile);
          finalAvatarUrl = uploadedUrl;
          await ensureProfileExists({
            id: userId,
            avatar_url: uploadedUrl,
          });
        } catch (uploadErr) {
          console.warn("Avatar upload fallback notice:", uploadErr);
        }
      }

      setSuccessMessage("Account created successfully! Launching your Six9Chat workspace...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please check your credentials.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get Avatar Initials
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "S9";

  return (
    <div className="relative min-h-screen w-screen bg-[#0A0F1D] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-[#1DB980] selection:text-black">
      {/* Six9-Style Top Ambient Gradient Banner */}
      <div className="h-44 w-full bg-gradient-to-r from-[#1DB980]/20 via-[#8E24AA]/25 to-[#0070F3]/25 absolute top-0 left-0 border-b border-slate-800/60 backdrop-blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-[#1DB980]/15 blur-[160px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-[#0070F3]/15 blur-[160px]" />

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-6 pt-7 pb-4 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-3">
          <Logo size={42} showText={true} />
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#1DB980]" />
          <span>Encrypted Account Setup</span>
        </div>
      </header>

      {/* Main Container Card */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-[560px] bg-[#0F172A]/90 backdrop-blur-2xl rounded-3xl border border-slate-800 shadow-[0_20px_70px_rgba(0,0,0,0.65)] overflow-hidden"
        >
          {/* Card Header & Multi-Step Progress Bar */}
          <div className="p-7 pb-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-[#1DB980] font-bold">
                Six9 Chat Profile Setup
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Step {step} of 2
              </span>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  step >= 1
                    ? "bg-gradient-to-r from-[#1DB980] to-[#0070F3]"
                    : "bg-slate-800"
                }`}
              />
              <div
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  step === 2
                    ? "bg-gradient-to-r from-[#0070F3] to-[#8E24AA]"
                    : "bg-slate-800"
                }`}
              />
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              {step === 1 ? "Create Your Six9 Account" : "Customize Your Profile"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {step === 1
                ? "Provide your details to connect with friends and teammates"
                : "Set your Six9 Chat avatar, handle, and status"}
            </p>
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

          {/* Form Content */}
          <div className="p-7 pt-2">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                /* STEP 1: CREDENTIALS */
                <motion.form
                  key="step-1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleProceedToStep2}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Display Name / Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Alex Rivers"
                        value={fullName}
                        onChange={(e) => handleFullNameChange(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="alex@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Phone Number (Optional for SMS Sync)
                    </label>
                    <div className="flex items-center gap-2">
                      <CountryCodeSelector
                        selectedCountry={selectedCountry}
                        onSelect={setSelectedCountry}
                      />
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="300 1234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ""))}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition font-mono"
                        />
                      </div>
                    </div>
                    {phone.trim() && (
                      <p className="text-[11px] text-slate-400 mt-1.5 pl-0.5 flex items-center gap-1.5">
                        <span className="text-slate-500">Sync Number:</span>
                        <span className="font-mono text-[#1DB980] font-semibold">
                          {selectedCountry.dial_code} {phone.replace(/\D/g, "")}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] text-black font-bold text-sm hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#1DB980]/20 flex items-center justify-center gap-2"
                  >
                    <span>Continue to Profile Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                /* STEP 2: PROFILE SETUP */
                <motion.form
                  key="step-2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleCompleteSignup}
                  className="space-y-5"
                >
                  {/* Six9-Style Circular Avatar Preview with Camera Overlay */}
                  <div className="flex flex-col items-center justify-center pt-2">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div
                        className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl ring-4 ring-[#1DB980]/30 transition-transform group-hover:scale-105 overflow-hidden ${
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
                            alt="Avatar Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>

                      {/* Camera Badge */}
                      <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1DB980] text-black flex items-center justify-center shadow-md border-2 border-[#0F172A] group-hover:bg-[#159a68] transition">
                        <Camera className="w-4 h-4" />
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <p className="text-xs text-slate-400 mt-2">
                      Tap camera to upload custom photo or pick a palette below
                    </p>

                    {/* Palette Presets */}
                    <div className="flex items-center gap-2.5 mt-3">
                      {AVATAR_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSelectedPresetAvatar(preset.id);
                            setCustomAvatarUrl(null);
                          }}
                          className={`w-7 h-7 rounded-full bg-gradient-to-tr ${preset.gradient} transition-transform ${
                            selectedPresetAvatar === preset.id && !customAvatarUrl
                              ? "scale-125 ring-2 ring-white"
                              : "hover:scale-110 opacity-80"
                          }`}
                          title={preset.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Username Field */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Username / Chat Handle *
                    </label>
                    <div className="relative">
                      <AtSign className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="alex_rivers"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                        }
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] transition font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Six9 Chat Status / About Bio */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      About / Status Line
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
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
                      {STATUS_PRESETS.slice(0, 5).map((preset, idx) => (
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

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900 transition flex items-center gap-2 text-xs font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA] text-black font-bold text-sm hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-[#1DB980]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>Creating Profile...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete & Open Six9Chat</span>
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Card Footer: Back to Login */}
          <div className="p-5 bg-slate-950/60 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>Already have an account? </span>
            <Link
              href="/login"
              className="text-[#1DB980] hover:underline font-semibold"
            >
              Sign in to Six9 Chat
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-xs text-slate-500">
        Six9Chat • Next.js 16 & Supabase Auth Architecture • End-to-End Encrypted
      </footer>
    </div>
  );
}
