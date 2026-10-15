"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  RefreshCw,
  Fingerprint,
  Eye,
  EyeOff,
  AtSign,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LanguageSelector } from "@/components/auth/LanguageSelector";
import { Language, DEFAULT_LANGUAGE } from "@/lib/languages";
import {
  checkUsername,
  registerWithCredentials,
  loginWithCredentials,
  getCurrentUser,
} from "@/lib/auth";

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="relative min-h-screen w-screen bg-[#053b53] flex flex-col items-center justify-center text-slate-100">
          <div className="w-10 h-10 rounded-full border-2 border-[#97D7FF] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </React.Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/chat";

  // Mode: "login" | "signup"
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  // Common Form State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign In State
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up State
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Realtime Username Check State
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto redirect if already authenticated
  useEffect(() => {
    async function checkExistingAuth() {
      const user = await getCurrentUser();
      if (user) {
        router.push(redirectPath);
      }
    }
    checkExistingAuth();
  }, [router, redirectPath]);

  // Debounced realtime username availability check
  const performUsernameCheck = useCallback(async (name: string) => {
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!clean || clean.length < 3) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const res = await checkUsername(clean);
      setUsernameAvailable(res.available);
      setUsernameSuggestions(res.available ? [] : res.suggestions);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setSignupUsername(clean);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (clean.length >= 3) {
      setIsCheckingUsername(true);
      checkTimeoutRef.current = setTimeout(() => {
        performUsernameCheck(clean);
      }, 250);
    } else {
      setIsCheckingUsername(false);
    }
  };

  const handleSelectSuggestion = (suggested: string) => {
    setSignupUsername(suggested);
    performUsernameCheck(suggested);
  };

  // Submit Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === "login") {
      // Handle Login
      if (!loginIdentifier.trim()) {
        setErrorMessage("Please enter your username or email address.");
        return;
      }
      if (!loginPassword.trim()) {
        setErrorMessage("Please enter your password.");
        return;
      }

      setIsLoading(true);
      try {
        const result = await loginWithCredentials({
          identifier: loginIdentifier,
          password: loginPassword,
        });

        const assignedUid = result.assignedUid || "S9-01";
        setSuccessMessage(`Welcome back! UID: ${assignedUid}. Loading chat...`);

        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 350);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Sign in failed. Please check credentials.");
        setIsLoading(false);
      }
    } else {
      // Handle Signup
      const cleanUser = signupUsername.trim().toLowerCase();
      const cleanMail = signupEmail.trim().toLowerCase();

      if (!cleanUser || cleanUser.length < 3) {
        setErrorMessage("Username must be at least 3 characters.");
        return;
      }
      if (usernameAvailable === false) {
        setErrorMessage("Please choose an available username.");
        return;
      }
      if (!cleanMail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanMail)) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
      if (!signupPassword || signupPassword.length < 4) {
        setErrorMessage("Password must be at least 4 characters.");
        return;
      }
      if (signupPassword !== signupConfirmPassword) {
        setErrorMessage("Passwords do not match. Please verify.");
        return;
      }

      setIsLoading(true);
      try {
        const result = await registerWithCredentials({
          username: cleanUser,
          email: cleanMail,
          password: signupPassword,
        });

        const assignedUid = result.assignedUid || "S9-01";
        setSuccessMessage(`Account created! Assigned UID: ${assignedUid}. Entering chat...`);

        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 350);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to create account.");
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      dir={selectedLanguage.direction || "ltr"}
      className="relative min-h-screen w-screen bg-[#053b53] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-[#97D7FF] selection:text-[#086288]"
    >
      {/* Ambient Glow Elements */}
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
          {/* Dual Flow Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#053b53] rounded-2xl border border-[#4D8DBA]/35 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                mode === "login"
                  ? "bg-[#086288] text-white shadow-md border border-[#4D8DBA]/50"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                mode === "signup"
                  ? "bg-[#086288] text-white shadow-md border border-[#4D8DBA]/50"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Card Header Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {mode === "login" ? "Welcome to Six9Chat" : "Create Your Account"}
            </h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {mode === "login"
                ? "Sign in with your username or email address"
                : "Real-time username verification & sequential UID generation"}
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
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === "signup" ? (
              // =========================================================
              // SIGN UP FORM (Username live check, Email, Password, Confirm)
              // =========================================================
              <>
                {/* 1. Username Field with Realtime Check */}
                <div>
                  <label
                    htmlFor="signup-username"
                    className="block text-xs font-semibold text-slate-200 mb-1"
                  >
                    Username
                  </label>
                  <div className="relative flex items-center">
                    <AtSign className="w-4 h-4 text-[#97D7FF] absolute left-3.5 pointer-events-none" />
                    <input
                      id="signup-username"
                      type="text"
                      autoComplete="username"
                      value={signupUsername}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="e.g. alexrivers"
                      disabled={isLoading}
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                    />

                    {/* Right Tick Mark Indicator */}
                    <div className="absolute right-3 flex items-center justify-center">
                      {isCheckingUsername ? (
                        <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                      ) : usernameAvailable === true ? (
                        <div
                          title="Username is available!"
                          className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 animate-in fade-in"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div
                          title={
                            usernameAvailable === false
                              ? "Username is taken"
                              : "Enter at least 3 characters"
                          }
                          className="flex items-center justify-center w-6 h-6 rounded-full text-slate-500"
                        >
                          <Check className="w-4 h-4 stroke-[2]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3 Alternative Username Suggestions if Taken */}
                  {usernameAvailable === false && usernameSuggestions.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#086288]/50 border border-[#4D8DBA]/40 text-xs">
                      <p className="text-slate-300 text-[11px] font-medium mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#FFEFC4]" />
                        <span>Username taken. Try these available options:</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {usernameSuggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleSelectSuggestion(sug)}
                            className="px-2.5 py-1 rounded-lg bg-[#053b53] hover:bg-[#97D7FF] text-[#FFEFC4] hover:text-[#086288] border border-[#4D8DBA]/50 font-mono text-[11px] font-bold transition cursor-pointer"
                          >
                            @{sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Email Address Field */}
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-semibold text-slate-200 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#97D7FF] absolute left-3.5 pointer-events-none" />
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      disabled={isLoading}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                    />
                  </div>
                </div>

                {/* 3. Password Field */}
                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-semibold text-slate-200 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#97D7FF] absolute left-3.5 pointer-events-none" />
                    <input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 4. Confirm Password Field */}
                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-semibold text-slate-200 mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#97D7FF] absolute left-3.5 pointer-events-none" />
                    <input
                      id="signup-confirm-password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                    />
                  </div>
                </div>

                {/* Sequential UID Notice Pill */}
                <div className="p-3 rounded-2xl bg-[#053b53]/80 border border-[#4D8DBA]/35 text-xs text-slate-300 flex items-center gap-2.5">
                  <Fingerprint className="w-4 h-4 text-[#97D7FF] shrink-0" />
                  <span className="text-[11px] leading-relaxed">
                    Sequential UID starting from <strong>S9-01</strong> automatically assigned on signup.
                  </span>
                </div>
              </>
            ) : (
              // =========================================================
              // SIGN IN FORM (Username or Email, Password)
              // =========================================================
              <>
                {/* 1. Username or Email */}
                <div>
                  <label
                    htmlFor="login-identifier"
                    className="block text-xs font-semibold text-slate-200 mb-1"
                  >
                    Username or Email Address
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#97D7FF] absolute left-3.5 pointer-events-none" />
                    <input
                      id="login-identifier"
                      type="text"
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Username or name@gmail.com"
                      disabled={isLoading}
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                    />
                  </div>
                </div>

                {/* 2. Password */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-200 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#97D7FF] absolute left-3.5 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full h-12 pl-10 pr-10 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 rounded-xl bg-[#97D7FF] hover:bg-[#b4e3ff] text-[#086288] font-black text-sm active:scale-[0.99] transition shadow-lg shadow-[#086288]/40 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#086288]" />
                  <span>
                    {mode === "login" ? "Signing In..." : "Creating Account..."}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {mode === "login"
                      ? "Sign In & Enter Chat"
                      : "Create Account & Enter Chat"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Toggle Footer */}
          <div className="mt-5 pt-4 text-center border-t border-[#4D8DBA]/25">
            {mode === "login" ? (
              <p className="text-xs text-slate-300">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-[#97D7FF] hover:underline cursor-pointer ml-1"
                >
                  Create New Account
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-300">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-[#97D7FF] hover:underline cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </main>

      <footer className="relative z-20 py-4 text-center text-xs text-slate-300">
        Six9Chat • Realtime Username Check &amp; S9-01 UID System
      </footer>
    </div>
  );
}
