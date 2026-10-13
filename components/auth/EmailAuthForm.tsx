"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface EmailAuthFormProps {
  onSuccess?: () => void;
}

export function EmailAuthForm({ onSuccess }: EmailAuthFormProps) {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth();

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<"github" | "google" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Email format validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score <= 3) return { score: 2, label: "Fair", color: "bg-amber-500" };
    if (score <= 4) return { score: 3, label: "Good", color: "bg-blue-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = mode === "signin" || password === confirmPassword;

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessNotice(null);

    if (!isEmailValid) {
      setAuthError("Please provide a valid email address.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    if (mode === "signin") {
      const { data, error } = await signInWithEmail(email, password);
      setIsLoading(false);

      if (error) {
        setAuthError(error.message || "Invalid credentials.");
      } else if (data?.user) {
        onSuccess?.();
      }
    } else {
      // Sign up
      const { data, error } = await signUpWithEmail(email, password, name);
      setIsLoading(false);

      if (error) {
        setAuthError(error.message || "Failed to create account.");
      } else if (data?.user) {
        // If email confirmation is required by Supabase project
        if (data.session) {
          onSuccess?.();
        } else {
          setSuccessNotice(
            "Account created! Check your email inbox to confirm your account, or sign in now."
          );
          setMode("signin");
        }
      }
    }
  };

  // Social OAuth Handler
  const handleSocialAuth = async (provider: "github" | "google") => {
    setAuthError(null);
    setIsSocialLoading(provider);

    const { error } = await signInWithOAuth(provider);
    if (error) {
      setIsSocialLoading(null);
      setAuthError(error.message || `Failed to authenticate with ${provider}.`);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Toggle Tab: Sign In vs Create Account */}
      <div className="relative p-1 rounded-xl bg-[#053b53] border border-[#4D8DBA]/50 grid grid-cols-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setAuthError(null);
          }}
          className={`relative z-10 py-1.5 rounded-lg text-center transition ${
            mode === "signin" ? "text-[#086288]" : "text-[#FFEFC4]/80 hover:text-white"
          }`}
        >
          {mode === "signin" && (
            <motion.div
              layoutId="emailAuthModeActivePill"
              className="absolute inset-0 bg-[#97D7FF] rounded-lg shadow-md"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setAuthError(null);
          }}
          className={`relative z-10 py-1.5 rounded-lg text-center transition ${
            mode === "signup" ? "text-[#086288]" : "text-[#FFEFC4]/80 hover:text-white"
          }`}
        >
          {mode === "signup" && (
            <motion.div
              layoutId="emailAuthModeActivePill"
              className="absolute inset-0 bg-[#97D7FF] rounded-lg shadow-md"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">Create Account</span>
        </button>
      </div>

      {/* Main Email Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name (Sign Up only) */}
        {mode === "signup" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-xs font-semibold text-[#FFEFC4] mb-1">
              Your Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivers"
                className="w-full h-10 px-3.5 pl-9 rounded-xl bg-[#053b53] border border-[#4D8DBA]/50 hover:border-[#4D8DBA] focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] text-xs text-white placeholder-slate-400 outline-none transition"
              />
              <User className="w-4 h-4 text-[#4D8DBA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </motion.div>
        )}

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-[#FFEFC4] mb-1">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAuthError(null);
              }}
              placeholder="alex@six9chat.com"
              className={`w-full h-10 px-3.5 pl-9 pr-8 rounded-xl bg-[#053b53] border text-xs text-white placeholder-slate-400 outline-none transition ${
                email && isEmailValid
                  ? "border-emerald-500/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  : "border-[#4D8DBA]/50 hover:border-[#4D8DBA] focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF]"
              }`}
            />
            <Mail className="w-4 h-4 text-[#4D8DBA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {email && isEmailValid && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[#FFEFC4]">
              Password
            </label>
            {mode === "signin" && (
              <button
                type="button"
                onClick={() =>
                  alert(
                    "Password reset: Enter your registered email to request a reset link from Supabase Auth."
                  )
                }
                className="text-[11px] text-[#97D7FF] hover:text-[#b4e3ff] transition font-medium"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setAuthError(null);
              }}
              placeholder="••••••••"
              className="w-full h-10 px-3.5 pl-9 pr-9 rounded-xl bg-[#053b53] border border-[#4D8DBA]/50 hover:border-[#4D8DBA] focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] text-xs text-white placeholder-slate-400 font-mono outline-none transition"
            />
            <Lock className="w-4 h-4 text-[#4D8DBA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Password strength indicator on signup */}
          {mode === "signup" && password && (
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Strength</span>
                <span className="font-semibold text-slate-200">
                  {passwordStrength.label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full rounded-full transition-colors ${
                      step <= passwordStrength.score
                        ? passwordStrength.color
                        : "bg-slate-700/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password (Sign Up only) */}
        {mode === "signup" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-xs font-semibold text-[#FFEFC4] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setAuthError(null);
                }}
                placeholder="••••••••"
                className={`w-full h-10 px-3.5 pl-9 pr-9 rounded-xl bg-[#053b53] border text-xs text-white placeholder-slate-400 font-mono outline-none transition ${
                  confirmPassword && !passwordsMatch
                    ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : confirmPassword && passwordsMatch
                    ? "border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    : "border-[#4D8DBA]/50 hover:border-[#4D8DBA] focus:border-[#97D7FF]"
                }`}
              />
              <Lock className="w-4 h-4 text-[#4D8DBA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {confirmPassword && passwordsMatch && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </motion.div>
        )}

        {/* Error Feedback */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </motion.div>
        )}

        {/* Success Feedback */}
        {successNotice && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successNotice}</span>
          </motion.div>
        )}

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isLoading || !email || !password || (mode === "signup" && !passwordsMatch)}
          className="w-full h-11 rounded-xl bg-[#97D7FF] hover:bg-[#b4e3ff] text-[#086288] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#086288]/30 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>{mode === "signin" ? "Sign In to Six9Chat" : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Social Divider */}
      <div className="relative flex items-center justify-center pt-1">
        <div className="w-full border-t border-[#4D8DBA]/35" />
        <span className="absolute px-3 bg-[#086288] text-[11px] font-semibold text-[#FFEFC4] uppercase tracking-wider">
          Or continue with
        </span>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {/* GitHub OAuth */}
        <button
          type="button"
          disabled={Boolean(isSocialLoading)}
          onClick={() => handleSocialAuth("github")}
          className="h-10 px-3 rounded-xl bg-[#053b53] hover:bg-[#086288] border border-[#4D8DBA]/50 hover:border-[#97D7FF] text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isSocialLoading === "github" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          )}
          <span>GitHub</span>
        </button>

        {/* Google OAuth */}
        <button
          type="button"
          disabled={Boolean(isSocialLoading)}
          onClick={() => handleSocialAuth("google")}
          className="h-10 px-3 rounded-xl bg-[#053b53] hover:bg-[#086288] border border-[#4D8DBA]/50 hover:border-[#97D7FF] text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isSocialLoading === "google" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z" />
            </svg>
          )}
          <span>Google</span>
        </button>
      </div>
    </div>
  );
}
