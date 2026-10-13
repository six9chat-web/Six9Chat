"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Edit2,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react";
import { DEFAULT_COUNTRY, Country } from "@/lib/countries";
import { CountryCodeSelector } from "@/components/auth/CountryCodeSelector";
import { useAuth } from "@/lib/auth";

interface PhoneOtpFormProps {
  onSuccess?: () => void;
}

export function PhoneOtpForm({ onSuccess }: PhoneOtpFormProps) {
  const { signInWithPhone, verifyPhoneOtp } = useAuth();

  // Stage: 'phone_input' | 'otp_verify'
  const [stage, setStage] = useState<"phone_input" | "otp_verify">("phone_input");

  // Phone input states
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // OTP states
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState(false);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);

  // OTP inputs refs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format phone number as digits only
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^\d\s-]/g, "");
    setPhoneNumber(rawVal);
    setPhoneError(null);
  };

  const cleanDigits = phoneNumber.replace(/\D/g, "");
  const fullPhoneNumber = `${selectedCountry.dial_code}${cleanDigits}`;

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage === "otp_verify" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage, countdown]);

  // Focus first OTP input when transitioning to 'otp_verify'
  useEffect(() => {
    if (stage === "otp_verify") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [stage]);

  // Handle Send Verification Code
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cleanDigits.length < 7) {
      setPhoneError("Please enter a valid phone number (minimum 7 digits).");
      return;
    }

    setIsSendingCode(true);
    setPhoneError(null);
    setProviderNotice(null);

    const { error } = await signInWithPhone(fullPhoneNumber);

    setIsSendingCode(false);

    if (error) {
      // Check if it's an unconfigured SMS provider in Supabase
      const errMsg = error.message || "";
      if (
        errMsg.toLowerCase().includes("sms provider") ||
        errMsg.toLowerCase().includes("unsupported phone") ||
        errMsg.toLowerCase().includes("twilio") ||
        errMsg.toLowerCase().includes("messagebird") ||
        errMsg.toLowerCase().includes("not enabled")
      ) {
        setProviderNotice(
          "Supabase SMS provider not yet configured in project dashboard. You can test with Email auth, or proceed to OTP verification."
        );
        // Switch to OTP verify so user can still test/see UI
        setStage("otp_verify");
        setCountdown(60);
        setCanResend(false);
      } else {
        setPhoneError(errMsg || "Failed to dispatch verification code.");
      }
    } else {
      setStage("otp_verify");
      setCountdown(60);
      setCanResend(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = cleaned[cleaned.length - 1]; // take latest single digit
    setOtp(nextOtp);
    setOtpError(null);

    // Auto-advance to next input
    if (index < 5 && cleaned) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits entered, auto-verify
    const completeToken = nextOtp.join("");
    if (completeToken.length === 6 && !nextOtp.includes("")) {
      triggerVerification(completeToken);
    }
  };

  // Handle Backspace and Arrow keys
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste full 6-digit OTP
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData) {
      const nextOtp = [...otp];
      for (let i = 0; i < pasteData.length; i++) {
        nextOtp[i] = pasteData[i];
      }
      setOtp(nextOtp);
      const targetIndex = Math.min(pasteData.length, 5);
      inputRefs.current[targetIndex]?.focus();

      if (pasteData.length === 6) {
        triggerVerification(pasteData);
      }
    }
  };

  // Trigger verify OTP
  const triggerVerification = async (tokenToVerify?: string) => {
    const code = tokenToVerify || otp.join("");
    if (code.length !== 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    const { data, error } = await verifyPhoneOtp(fullPhoneNumber, code);

    setIsVerifying(false);

    if (error) {
      setOtpError(error.message || "Invalid or expired verification code.");
    } else if (data?.user) {
      onSuccess?.();
    }
  };

  // Resend OTP code
  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    setOtp(["", "", "", "", "", ""]);
    setOtpError(null);
    await handleSendCode();
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {stage === "phone_input" ? (
          <motion.form
            key="phone_input"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSendCode}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number
              </label>

              <div className="flex gap-2 items-center">
                <CountryCodeSelector
                  selectedCountry={selectedCountry}
                  onSelect={setSelectedCountry}
                  disabled={isSendingCode}
                />

                <div className="relative flex-1">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    disabled={isSendingCode}
                    placeholder="300 1234567"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] text-sm text-white placeholder-slate-400 font-mono tracking-wider outline-none transition disabled:opacity-50"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-1.5">
                We'll send a 6-digit Six9 Chat SMS verification code to{" "}
                <span className="font-mono text-emerald-400 font-medium">
                  {fullPhoneNumber}
                </span>
              </p>
            </div>

            {/* Error Message */}
            {phoneError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{phoneError}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSendingCode || cleanDigits.length < 7}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#1DB980] to-[#0070F3] hover:from-[#1DB980]/90 hover:to-[#0070F3]/90 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#1DB980]/20 transition disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-emerald-500/25 active:scale-[0.99]"
            >
              {isSendingCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Code...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="otp_verify"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Header / Edit number banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Code sent to</span>
                <span className="font-mono font-bold text-white text-sm">
                  {fullPhoneNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStage("phone_input");
                  setOtp(["", "", "", "", "", ""]);
                  setOtpError(null);
                }}
                className="flex items-center gap-1 text-[#1DB980] hover:text-emerald-300 font-medium px-2 py-1 rounded-lg hover:bg-slate-700/50 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            </div>

            {/* Provider Notice if in Dev / Mock */}
            {providerNotice && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{providerNotice}</span>
              </div>
            )}

            {/* 6 Digits OTP Input Box Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                Enter 6-Digit Verification PIN
              </label>

              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-bold text-lg sm:text-xl rounded-xl bg-slate-800/90 border transition outline-none ${
                      digit
                        ? "border-[#1DB980] text-white bg-slate-800 shadow-[0_0_12px_rgba(29,185,128,0.2)]"
                        : "border-slate-700 text-slate-300 focus:border-[#0070F3] focus:ring-1 focus:ring-[#0070F3]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* OTP Error Message */}
            {otpError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </motion.div>
            )}

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => triggerVerification()}
              disabled={isVerifying || otp.join("").length !== 6}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#1DB980] to-[#0070F3] hover:from-[#1DB980]/90 hover:to-[#0070F3]/90 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#1DB980]/20 transition disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-emerald-500/25 active:scale-[0.99]"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Proceed to Chat</span>
                </>
              )}
            </button>

            {/* Resend Code / Timer Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Didn't receive SMS code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="flex items-center gap-1 text-[#1DB980] hover:text-emerald-300 font-semibold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resend Code</span>
                </button>
              ) : (
                <span className="font-mono text-slate-400">
                  Resend in <strong className="text-white">{countdown}s</strong>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
