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
import { supabase } from "@/lib/supabaseClient";

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

  // Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign In State (strictly isolated from signup and from each other)
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up State
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

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
    const clean = name.trim().replace(/[^a-zA-Z0-9_]/g, "");
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
    const clean = val.replace(/[^a-zA-Z0-9_]/g, "");
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

  // Switch mode handler - cleanly resets feedback & isolated field states
  const switchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Submit Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === "login") {
      const cleanId = loginIdentifier.trim();
      const cleanPass = loginPassword.trim();

      if (!cleanId) {
        setErrorMessage("Please enter your username or email address.");
        return;
      }
      if (!cleanPass) {
        setErrorMessage("Please enter your password.");
        return;
      }

      setIsLoading(true);
      try {
        let emailToUse = cleanId;

        // If the input contains an '@' symbol, treat it as an email for supabase.auth.signInWithPassword
        if (cleanId.includes("@")) {
          emailToUse = cleanId;
        } else {
          // If it does not contain '@', first query the public.profiles table to look up the associated email using the entered username
          const { data: profileData, error: profileErr } = await supabase
            .from("profiles")
            .select("email, id, username, full_name, uid")
            .ilike("username", cleanId)
            .limit(1)
            .maybeSingle();

          if (profileErr) {
            console.error("Profile lookup error:", profileErr);
          }

          if (profileData?.email) {
            emailToUse = profileData.email;
          } else {
            throw new Error(
              `No account found with username "${cleanId}". Please check your username or use your email address.`
            );
          }
        }

        // Pass that email to supabase.auth.signInWithPassword
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: cleanPass,
        });

        if (authError) {
          throw authError;
        }

        // Synchronize local storage UID and session
        const authUser = authData?.user;
        const assignedUid = (authUser?.user_metadata?.uid as string) || "S9-01";
        if (typeof window !== "undefined" && authUser) {
          const uName = (authUser.user_metadata?.username as string) || cleanId.replace(/@.+/, "");
          localStorage.setItem(`six9_uid_${uName.toLowerCase()}`, assignedUid);
          localStorage.setItem(`six9_uid_${authUser.id}`, assignedUid);
          localStorage.setItem("six9_current_uid", assignedUid);
        }

        // Also sync backend session cookie/memory cache
        try {
          await loginWithCredentials({
            identifier: emailToUse,
            password: cleanPass,
          });
        } catch {
          // Client Supabase session is established
        }

        setSuccessMessage(`Welcome back! Loading chat...`);

        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 300);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Sign in failed. Please check credentials.");
        setIsLoading(false);
      }
    } else {
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
        const fullName = cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1);

        // 1. Direct Supabase Auth signUp sending username, full_name and user_metadata properly
        try {
          await supabase.auth.signUp({
            email: cleanMail,
            password: signupPassword,
            options: {
              data: {
                username: cleanUser,
                full_name: fullName,
                name: fullName,
                about: "Hey there! I am using Six9Chat 🚀",
                status: "Hey there! I am using Six9Chat 🚀",
              },
            },
          });
        } catch (sbErr) {
          console.warn("Direct Supabase Auth signUp note:", sbErr);
        }

        // 2. Register credentials & ensure profile and persistent session creation
        const result = await registerWithCredentials({
          username: cleanUser,
          email: cleanMail,
          password: signupPassword,
        });

        setSuccessMessage(`Account created successfully! Entering chat...`);

        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 300);
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
          {/* Card Header Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {mode === "login" ? "Welcome to Six9Chat" : "Create Your Account"}
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              {mode === "login"
                ? "Sign in with your username or email address"
                : "Enter your details below to get started with Six9Chat"}
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
                      name="username"
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
                      name="email"
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

                {/* 3. Password Field with Eye Toggle */}
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
                      name="new-password"
                      type={showSignupPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 p-1 text-slate-400 hover:text-white transition cursor-pointer"
                      title={showSignupPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 4. Confirm Password Field with Eye Toggle */}
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
                      name="confirm-password"
                      type={showSignupConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      className="absolute right-3 p-1 text-slate-400 hover:text-white transition cursor-pointer"
                      title={showSignupConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // =========================================================
              // SIGN IN FORM (Strictly isolated Username/Email & Password)
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
                      key="login-identifier-input"
                      id="login-identifier"
                      name="login-identifier"
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
                      key="login-password-input"
                      id="login-password"
                      name="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full h-12 pl-10 pr-10 rounded-xl bg-[#053b53] border border-[#4D8DBA]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 p-1 text-slate-400 hover:text-white transition cursor-pointer"
                      title={showLoginPassword ? "Hide password" : "Show password"}
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
                Need an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-bold text-[#97D7FF] hover:underline cursor-pointer ml-1"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-300">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
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
        Six9Chat • Encrypted Real-Time Messaging Network
      </footer>
    </div>
  );
}
