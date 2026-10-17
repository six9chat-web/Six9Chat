"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { UserProfile } from "@/types/chat";

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  status: string;
  phone: string;
  email?: string;
  uid?: string;
  about?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SignUpParams {
  email: string;
  password?: string;
  phone?: string;
  fullName?: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  status?: string;
  uid?: string;
}

export interface AuthResultData {
  user?: User | null;
  session?: Session | null;
  messageId?: string | null;
  [key: string]: unknown;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  currentUserUid: string;
  signInWithEmailOtp: (email: string) => Promise<{ error: AuthError | Error | null; data: AuthResultData | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: AuthError | Error | null; data: AuthResultData | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: AuthError | Error | null; data: AuthResultData | null }>;
  signInWithPhoneOtp: (phone: string) => Promise<{ error: AuthError | Error | null; data: AuthResultData | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: AuthError | Error | null; data: AuthResultData | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | Error | null; data: AuthResultData | null }>;
  signUpWithEmail: (
    param1: string | SignUpParams,
    param2?: string,
    param3?: string | Record<string, unknown>
  ) => Promise<{ error: AuthError | Error | null; data: AuthResultData | null }>;
  signInWithOAuth: (provider: "github" | "google") => Promise<{ error: AuthError | Error | null; data: AuthResultData | null }>;
  signOut: () => Promise<void>;
  saveUserProfile: (profileData: {
    name: string;
    avatar: string;
    statusText?: string;
    phone?: string;
    email?: string;
    uid?: string;
  }) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  setNeedsOnboarding: (val: boolean) => void;
}

/**
 * Standalone: Sign up a new user with Email and Password
 */
export async function signUpWithEmail(
  param1: string | SignUpParams,
  param2?: string,
  param3?: string | Record<string, unknown>
) {
  let email = "";
  let password = "";
  let fullName = "";
  let username = "";
  let phone = "";
  let avatarUrl = "";
  let status = "Hey there! I am using Six9Chat";

  if (typeof param1 === "object") {
    email = param1.email;
    password = param1.password || "";
    fullName = param1.fullName || param1.name || "";
    username = param1.username || "";
    phone = param1.phone || "";
    avatarUrl = param1.avatarUrl || "";
    status = param1.status || status;
  } else {
    email = param1;
    password = param2 || "";
    const p3 = typeof param3 === "object" && param3 !== null ? param3 : null;
    fullName =
      typeof param3 === "string"
        ? param3
        : typeof p3?.full_name === "string"
        ? p3.full_name
        : typeof p3?.name === "string"
        ? p3.name
        : "";
    phone = typeof p3?.phone === "string" ? p3.phone : "";
    avatarUrl = typeof p3?.avatar_url === "string" ? p3.avatar_url : "";
  }

  if (!password) {
    throw new Error("Password is required for email signup");
  }

  const defaultAbout = status || "Hey there! I am using Six9Chat 🚀";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split("@")[0].toLowerCase(),
        full_name: fullName || email.split("@")[0],
        name: fullName || email.split("@")[0],
        about: defaultAbout,
        status: defaultAbout,
        phone: phone || "",
        avatar_url: avatarUrl || "",
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    try {
      await ensureProfileExists({
        id: data.user.id,
        username: username || email.split("@")[0].toLowerCase(),
        full_name: fullName || email.split("@")[0],
        email: email,
        avatar_url: avatarUrl || "",
        phone: phone || "",
        about: defaultAbout,
        status: defaultAbout,
      });
    } catch (e) {
      console.warn("Profile trigger fallback notice:", e);
    }
  }

  return data;
}

/**
 * Standalone: Sign in an existing user with Email and Password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Base site URL helper prioritizing live Vercel domain over localhost
 */
export function getSiteBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    if (!window.location.origin.includes("localhost") && !window.location.origin.includes("127.0.0.1")) {
      return window.location.origin;
    }
  }
  return "https://six9chat.vercel.app";
}

/**
 * Format sequential UID starting from S9-01 (e.g., S9-01, S9-02, S9-03...)
 */
export function formatSequentialUid(num: number): string {
  const padded = num < 10 ? `0${num}` : `${num}`;
  return `S9-${padded}`;
}

/**
 * Standalone: System-Generated Sequential Unique ID (UID) Generator
 * Format: S9-XX (e.g. S9-01, S9-02, S9-03...)
 * Fully SSR-safe and deterministic for Next.js 16
 */
export function generateSystemUid(seed?: string): string {
  if (typeof window === "undefined") {
    return "S9-01";
  }
  if (seed) {
    const existing = localStorage.getItem(`six9_uid_${seed}`);
    if (existing && /^S9-\d+$/i.test(existing)) return existing;
  }
  const currentStored = localStorage.getItem("six9_current_uid");
  if (currentStored && /^S9-\d+$/i.test(currentStored) && !seed) return currentStored;

  const storedLast = localStorage.getItem("six9_last_seq_num");
  const nextNum = storedLast ? parseInt(storedLast, 10) + 1 : 1;
  const uid = formatSequentialUid(nextNum);

  localStorage.setItem("six9_last_seq_num", String(nextNum));
  if (seed) localStorage.setItem(`six9_uid_${seed}`, uid);
  localStorage.setItem("six9_current_uid", uid);
  return uid;
}

export function getCurrentUserUid(userIdOrEmail?: string): string {
  if (typeof window === "undefined") {
    return "S9-01";
  }
  if (userIdOrEmail) {
    const stored = localStorage.getItem(`six9_uid_${userIdOrEmail}`);
    if (stored) return stored;
  }
  const current = localStorage.getItem("six9_current_uid");
  if (current) return current;
  return generateSystemUid(userIdOrEmail);
}

/**
 * Check if the user has an assigned sequential UID in Supabase profile database (starting from S9-01).
 * If not, query highest UID and assign a new sequential UID instantly (S9-01, S9-02, S9-03...).
 */
export async function getOrAssignSequentialUid(userId: string, email?: string): Promise<string> {
  const cleanEmail = email?.trim().toLowerCase() || "";

  // 1. Fast cache check
  if (typeof window !== "undefined") {
    const cachedUid =
      localStorage.getItem(`six9_uid_${userId}`) ||
      (cleanEmail ? localStorage.getItem(`six9_uid_${cleanEmail}`) : null);
    if (cachedUid && /^S9-\d+$/i.test(cachedUid)) {
      localStorage.setItem("six9_current_uid", cachedUid);
      return cachedUid;
    }
  }

  try {
    // 2. Query Supabase profiles table for existing user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("uid")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.uid && /^S9-\d+$/i.test(profile.uid)) {
      if (typeof window !== "undefined") {
        localStorage.setItem(`six9_uid_${userId}`, profile.uid);
        if (cleanEmail) localStorage.setItem(`six9_uid_${cleanEmail}`, profile.uid);
        localStorage.setItem("six9_current_uid", profile.uid);
      }
      return profile.uid;
    }

    // 3. Find highest sequential number in Supabase profiles (starts at 0 -> first is S9-01)
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("uid");

    let highestSeq = 0;
    if (allProfiles && allProfiles.length > 0) {
      for (const p of allProfiles) {
        if (p.uid) {
          const match = p.uid.match(/^S9-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num < 1000 && num > highestSeq) highestSeq = num;
          }
        }
      }
    }

    // Check local counter fallback
    if (typeof window !== "undefined") {
      const storedLast = localStorage.getItem("six9_last_seq_num");
      if (storedLast) {
        const lastNum = parseInt(storedLast, 10);
        if (lastNum < 1000 && lastNum > highestSeq) highestSeq = lastNum;
      }
    }

    const nextSeq = highestSeq + 1;
    const assignedUid = formatSequentialUid(nextSeq);

    if (typeof window !== "undefined") {
      localStorage.setItem("six9_last_seq_num", String(nextSeq));
      localStorage.setItem(`six9_uid_${userId}`, assignedUid);
      if (cleanEmail) localStorage.setItem(`six9_uid_${cleanEmail}`, assignedUid);
      localStorage.setItem("six9_current_uid", assignedUid);
    }

    // Update Supabase profile with the sequential UID
    await supabase
      .from("profiles")
      .update({ uid: assignedUid, updated_at: new Date().toISOString() })
      .eq("id", userId);

    return assignedUid;
  } catch (err) {
    console.warn("getOrAssignSequentialUid exception:", err);
    let nextSeq = 1;
    if (typeof window !== "undefined") {
      const storedLast = localStorage.getItem("six9_last_seq_num");
      if (storedLast) {
        const lastNum = parseInt(storedLast, 10);
        if (lastNum < 1000) nextSeq = lastNum + 1;
      }
      localStorage.setItem("six9_last_seq_num", String(nextSeq));
      const fallbackUid = formatSequentialUid(nextSeq);
      localStorage.setItem(`six9_uid_${userId}`, fallbackUid);
      if (cleanEmail) localStorage.setItem(`six9_uid_${cleanEmail}`, fallbackUid);
      localStorage.setItem("six9_current_uid", fallbackUid);
      return fallbackUid;
    }
    return formatSequentialUid(nextSeq);
  }
}

/**
 * Standalone: Send 6-digit OTP code to Gmail / Email address
 * Utilizes custom database OTP engine (/api/auth/send-otp) backed by user_otps table
 * with fallback to Supabase carrier
 */
export async function signInWithEmailOtp(email: string) {
  const cleanEmail = email.trim().toLowerCase();

  const res = await fetch("/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cleanEmail }),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.success) {
    throw new Error(result.error || "Failed to send 6-digit verification code.");
  }
  return result;
}

/**
 * Standalone: Verify 6-digit Email OTP code
 * Validates via custom database OTP engine (/api/auth/verify-otp) backed by user_otps table
 * completely bypassing default Supabase email verification
 */
export async function verifyEmailOtp(email: string, token: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cleanEmail, token: cleanToken }),
  });

  const result = await res.json().catch(() => ({}));
  if (res.ok && result.success && result.user) {
    const assignedUid = result.assignedUid || formatSequentialUid(1);
    if (typeof window !== "undefined") {
      localStorage.setItem(`six9_uid_${cleanEmail}`, assignedUid);
      localStorage.setItem(`six9_uid_${result.user.id}`, assignedUid);
      localStorage.setItem("six9_current_uid", assignedUid);
    }
    return {
      user: {
        id: result.user.id,
        email: cleanEmail,
        user_metadata: {
          full_name: result.user.name || cleanEmail.split("@")[0],
          uid: assignedUid,
        },
      } as unknown as User,
      data: result,
    };
  }

  throw new Error(result.error || "Invalid or expired verification code.");
}

/**
 * Standalone: Direct Email + 4-Digit Passcode / PIN Authentication
 * Seamless instant login & registration bypassing all email delays
 */
export async function signInWithPasscode(email: string, passcode: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPasscode = passcode.trim();

  const res = await fetch("/api/auth/passcode-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cleanEmail, passcode: cleanPasscode }),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.success || !result.user) {
    throw new Error(result.error || "Failed to sign in with passcode.");
  }

  const assignedUid = result.assignedUid || formatSequentialUid(1);
  if (typeof window !== "undefined") {
    localStorage.setItem(`six9_uid_${cleanEmail}`, assignedUid);
    localStorage.setItem(`six9_uid_${result.user.id}`, assignedUid);
    localStorage.setItem("six9_current_uid", assignedUid);
  }

  return {
    user: {
      id: result.user.id,
      email: cleanEmail,
      user_metadata: {
        full_name: result.user.name || cleanEmail.split("@")[0],
        uid: assignedUid,
      },
    } as unknown as User,
    data: result,
  };
}

/**
 * Realtime check username availability and get alternatives if taken
 */
export async function checkUsername(username: string): Promise<{
  available: boolean;
  suggestions: string[];
}> {
  try {
    const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
    const data = await res.json().catch(() => ({}));
    return {
      available: Boolean(data.available),
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    };
  } catch (err) {
    console.warn("[checkUsername error]:", err);
    return { available: false, suggestions: [] };
  }
}

/**
 * Register a new user with Username, Email, Password and Sequential UID S9-01
 */
export async function registerWithCredentials(params: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.success || !result.user) {
    throw new Error(result.error || "Failed to create account.");
  }

  const assignedUid = result.assignedUid || "S9-01";
  if (typeof window !== "undefined") {
    localStorage.setItem(`six9_uid_${params.email.toLowerCase()}`, assignedUid);
    localStorage.setItem(`six9_uid_${params.username.toLowerCase()}`, assignedUid);
    localStorage.setItem(`six9_uid_${result.user.id}`, assignedUid);
    localStorage.setItem("six9_current_uid", assignedUid);
    setMockSession({
      userId: result.user.id,
      email: result.user.email,
      username: result.user.username,
      fullName: result.user.fullName,
      uid: assignedUid,
      statusText: "Building with Six9Chat 🚀",
    });
  }

  return result;
}

/**
 * Login existing user with Username/Email and Password
 */
export async function loginWithCredentials(params: {
  identifier: string;
  password: string;
}) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.success || !result.user) {
    throw new Error(result.error || "Failed to sign in.");
  }

  const assignedUid = result.assignedUid || "S9-01";
  if (typeof window !== "undefined") {
    localStorage.setItem(`six9_uid_${params.identifier.toLowerCase()}`, assignedUid);
    localStorage.setItem(`six9_uid_${result.user.id}`, assignedUid);
    localStorage.setItem("six9_current_uid", assignedUid);
    setMockSession({
      userId: result.user.id,
      email: result.user.email,
      username: result.user.username,
      fullName: result.user.fullName,
      uid: assignedUid,
      statusText: "Building with Six9Chat 🚀",
    });
  }

  return result;
}

/**
 * Standalone: Send OTP to a Phone Number
 */
export async function signInWithPhoneOtp(phone: string) {
  const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });

  if (error) throw error;
  return data;
}

export const signInWithPhone = signInWithPhoneOtp;

/**
 * Standalone: Verify 6-digit Phone OTP code
 */
export async function verifyPhoneOtp(phone: string, token: string) {
  const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token,
    type: "sms",
  });

  if (error) throw error;

  if (data.user) {
    try {
      const existing = await getUserProfile(data.user.id);
      if (!existing) {
        await ensureProfileExists({
          id: data.user.id,
          username: `user_${data.user.id.slice(0, 6)}`,
          full_name: "",
          avatar_url: "",
          phone: formattedPhone,
          status: "Hey there! I am using Six9Chat",
        });
      }
    } catch (e) {
      console.warn("Profile fetch/upsert notice:", e);
    }
  }

  return data;
}

export interface MockSessionData {
  userId: string;
  email?: string;
  phone?: string;
  fullName?: string;
  username?: string;
  avatarUrl?: string;
  statusText?: string;
  uid?: string;
}

export function getMockSession(): MockSessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const rawCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("six9_mock_session="));
    if (rawCookie) {
      const val = decodeURIComponent(rawCookie.split("=")[1]);
      return JSON.parse(val);
    }
    const rawLocal = localStorage.getItem("six9_mock_session") || localStorage.getItem("six9_active_user");
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (parsed.userId || parsed.id) {
        return {
          userId: parsed.userId || parsed.id,
          email: parsed.email,
          phone: parsed.phone,
          fullName: parsed.fullName || parsed.full_name || parsed.name,
          username: parsed.username,
          avatarUrl: parsed.avatarUrl || parsed.avatar_url,
          statusText: parsed.statusText || parsed.status,
          uid: parsed.uid,
        };
      }
    }
  } catch (e) {
    console.warn("Failed to parse mock session:", e);
  }
  return null;
}

export function setMockSession(data: MockSessionData) {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(data);
    document.cookie = `six9_mock_session=${encodeURIComponent(json)}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem("six9_mock_session", json);
    localStorage.setItem("six9_active_user", json);
  } catch (e) {
    console.warn("Failed to set mock session:", e);
  }
}

export function clearMockSession() {
  if (typeof window === "undefined") return;
  try {
    document.cookie = "six9_mock_session=; path=/; max-age=0; SameSite=Lax";
    localStorage.removeItem("six9_mock_session");
    localStorage.removeItem("six9_active_user");
    localStorage.removeItem("six9_active_session");
  } catch (e) {
    console.warn("Failed to clear mock session:", e);
  }
}

/**
 * Standalone: Sign out current session
 */
export async function signOut() {
  clearMockSession();
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.warn("Supabase signOut notice:", error.message);
  } catch (err) {
    console.warn("Sign out notice:", err);
  }
}

/**
 * Standalone: Get currently authenticated Supabase user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) return user;
  } catch {
    // fall through
  }

  // Fallback to active mock session if Supabase is offline/mock mode
  const mock = getMockSession();
  if (mock) {
    return {
      id: mock.userId,
      app_metadata: {},
      user_metadata: {
        full_name: mock.fullName || "Six9 Member",
        name: mock.fullName || "Six9 Member",
        avatar_url: mock.avatarUrl || "",
        phone: mock.phone,
        status: mock.statusText || "Hey there! I am using Six9Chat 🚀",
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      phone: mock.phone,
    } as unknown as User;
  }

  return null;
}

/**
 * Standalone: Get current active session
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (!error && session) return session;
  } catch {
    // fall through
  }

  const mock = getMockSession();
  if (mock) {
    const user = {
      id: mock.userId,
      app_metadata: {},
      user_metadata: {
        full_name: mock.fullName || "Six9 Member",
        name: mock.fullName || "Six9 Member",
        username: mock.username || mock.fullName?.toLowerCase().replace(/\s+/g, "_") || "user",
        avatar_url: mock.avatarUrl || "",
        phone: mock.phone,
        status: mock.statusText || "Hey there! I am using Six9Chat 🚀",
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      phone: mock.phone,
    } as unknown as User;

    return {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      expires_in: 604800,
      token_type: "bearer",
      user,
    } as Session;
  }

  return null;
}

/**
 * Standalone: Fetch profile data for a specific user ID
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn("Exception fetching profile from Supabase:", err);
  }

  // Check local profile cache if database table is missing or empty
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`six9_profile_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      const mock = getMockSession();
      if (mock && mock.userId === userId) {
        return {
          id: mock.userId,
          username: mock.username || mock.fullName?.toLowerCase().replace(/\s+/g, "_") || `user_${mock.userId.slice(0, 6)}`,
          full_name: mock.fullName || "",
          avatar_url: mock.avatarUrl || "",
          status: mock.statusText || "Hey there! I am using Six9Chat",
          phone: mock.phone || "",
        };
      }
    } catch (e) {
      console.warn("Local profile check note:", e);
    }
  }

  return null;
}

/**
 * Standalone: Update user's profile information
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<Profile, "id" | "created_at">>
): Promise<Profile | null> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Always persist to local cache for instant resilience
  if (typeof window !== "undefined") {
    try {
      const prev = localStorage.getItem(`six9_profile_${userId}`);
      const base = prev ? JSON.parse(prev) : { id: userId };
      const merged = { ...base, ...payload };
      localStorage.setItem(`six9_profile_${userId}`, JSON.stringify(merged));

      const mock = getMockSession();
      if (mock && mock.userId === userId) {
        setMockSession({
          ...mock,
          fullName: updates.full_name ?? mock.fullName,
          avatarUrl: updates.avatar_url ?? mock.avatarUrl,
          statusText: updates.status ?? mock.statusText,
          phone: updates.phone ?? mock.phone,
        });
      }
    } catch (e) {
      console.warn("Local profile update note:", e);
    }
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      await supabase.auth.updateUser({ data: updates });
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Could not update remote profile table:", err);
    return null;
  }
}

/**
 * Standalone: Ensure a profile row exists in public.profiles
 */
export async function ensureProfileExists(profile: Partial<Profile> & { id: string }) {
  const normalizedProfile: Profile = {
    id: profile.id,
    username: profile.username || `user_${profile.id.slice(0, 6)}`,
    full_name: profile.full_name || "Six9Chat Member",
    avatar_url: profile.avatar_url || "",
    phone: profile.phone || "",
    email: profile.email || "",
    about: profile.about || profile.status || "Hey there! I am using Six9Chat",
    status: profile.status || profile.about || "Hey there! I am using Six9Chat",
    updated_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`six9_profile_${profile.id}`, JSON.stringify(normalizedProfile));
    } catch (e) {
      console.warn("Local profile ensure note:", e);
    }
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(normalizedProfile, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("ensureProfileExists remote notice:", error.message);
    }
    return data;
  } catch (err) {
    console.warn("ensureProfileExists remote exception:", err);
    return null;
  }
}

/**
 * Standalone: Upload Avatar to Supabase Storage 'avatars' bucket
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  let publicUrl = "";
  if (uploadError) {
    console.warn("Storage upload failed, using Data URL fallback:", uploadError.message);
    publicUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  } else {
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    publicUrl = data.publicUrl;
  }

  // Directly update profiles.avatar_url in Supabase database
  if (userId && publicUrl) {
    try {
      await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch (dbErr) {
      console.warn("Direct profiles.avatar_url update note:", dbErr);
    }
  }

  return publicUrl;
}

/**
 * Standalone: Listen to Auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return subscription;
}

/* ==============================================================================
   React Context & AuthProvider
   ============================================================================== */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);

  // Helper to load or construct profile for a given user
  const loadProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      setNeedsOnboarding(false);
      return;
    }

    try {
      // 1. Attempt to fetch database profile
      const dbProfile = await getUserProfile(authUser.id);

      const assignedUid =
        dbProfile?.uid ||
        authUser.user_metadata?.uid ||
        generateSystemUid(authUser.id || authUser.email || authUser.phone);

      const userEmail =
        dbProfile?.email ||
        authUser.email ||
        (typeof authUser.user_metadata?.email === "string" ? authUser.user_metadata.email : "");

      const name =
        dbProfile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        (userEmail ? userEmail.split("@")[0] : null) ||
        authUser.phone ||
        "Six9 Member";

      const initials = name
        ? name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "S9";

      const loadedProfile: UserProfile = {
        id: authUser.id,
        name: name,
        status: "online",
        statusText:
          dbProfile?.status ||
          authUser.user_metadata?.about ||
          authUser.user_metadata?.status ||
          "Hey there! I am using Six9Chat 🚀",
        avatar: dbProfile?.avatar_url || authUser.user_metadata?.avatar_url || initials,
        phone: dbProfile?.phone || authUser.phone || authUser.user_metadata?.phone || "",
        email: userEmail,
        uid: assignedUid,
      };

      setProfile(loadedProfile);

      // Check if user requires onboarding
      if (!name || name === "Six9 Member") {
        setNeedsOnboarding(false);
      } else {
        setNeedsOnboarding(false);
      }
    } catch (e) {
      console.warn("Profile mapping notice in AuthProvider:", e);
    }
  }, []);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await loadProfile(initialSession.user);
          try {
            localStorage.setItem("six9_active_user", JSON.stringify({
              userId: initialSession.user.id,
              email: initialSession.user.email,
              user_metadata: initialSession.user.user_metadata,
            }));
          } catch {}
        } else {
          // Check for active local mock session or cached user
          const mock = getMockSession();
          if (mock) {
            const mockUid = mock.uid || generateSystemUid(mock.userId || mock.email || mock.phone);
            const mockName = mock.fullName || (mock.email ? mock.email.split("@")[0] : "Six9 Member");
            const mockUser = {
              id: mock.userId,
              email: mock.email,
              app_metadata: {},
              user_metadata: {
                full_name: mockName,
                name: mockName,
                avatar_url: mock.avatarUrl || "",
                phone: mock.phone || "",
                email: mock.email || "",
                uid: mockUid,
                status: mock.statusText || "Hey there! I am using Six9Chat 🚀",
              },
              aud: "authenticated",
              created_at: new Date().toISOString(),
              phone: mock.phone,
            } as unknown as User;

            const mockSess = {
              access_token: "mock-token",
              refresh_token: "mock-refresh",
              expires_in: 31536000,
              token_type: "bearer",
              user: mockUser,
            } as Session;

            setSession(mockSess);
            setUser(mockUser);
            await loadProfile(mockUser);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn("Initial auth load error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        await loadProfile(newSession.user);
        try {
          localStorage.setItem("six9_active_user", JSON.stringify({
            userId: newSession.user.id,
            email: newSession.user.email,
            user_metadata: newSession.user.user_metadata,
          }));
        } catch {}
      } else {
        const mock = getMockSession();
        if (mock) {
          // Keep mock session active
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setNeedsOnboarding(false);
        }
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Context Actions
  const handleSignInWithEmailOtp = useCallback(async (email: string) => {
    try {
      const data = await signInWithEmailOtp(email);
      return { error: null, data };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)), data: null };
    }
  }, []);

  const handleVerifyEmailOtp = useCallback(async (email: string, token: string) => {
    try {
      const data = await verifyEmailOtp(email, token);
      return { error: null, data };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)), data: null };
    }
  }, []);

  const handleSignInWithPhone = useCallback(async (phoneNumber: string) => {
    try {
      const data = await signInWithPhoneOtp(phoneNumber);
      return { error: null, data };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)), data: null };
    }
  }, []);

  const handleVerifyPhoneOtp = useCallback(async (phoneNumber: string, token: string) => {
    try {
      const data = await verifyPhoneOtp(phoneNumber, token);
      return { error: null, data };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)), data: null };
    }
  }, []);

  const handleSignInWithEmail = useCallback(async (email: string, pass: string) => {
    try {
      const data = await signInWithEmail(email, pass);
      return { error: null, data };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)), data: null };
    }
  }, []);

  const handleSignUpWithEmail = useCallback(
    async (
      param1: string | SignUpParams,
      param2?: string,
      param3?: string | Record<string, unknown>
    ) => {
      try {
        const data = await signUpWithEmail(param1, param2, param3);
        return { error: null, data };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err : new Error(String(err)), data: null };
      }
    },
    []
  );

  const handleSignInWithOAuth = useCallback(async (provider: "github" | "google") => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${getSiteBaseUrl()}/auth/callback`,
        },
      });
      if (error) throw error;
      return { error: null, data };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)), data: null };
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn("Sign out notice:", err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setNeedsOnboarding(false);
      window.location.href = "/login";
    }
  }, []);

  const handleSaveUserProfile = useCallback(
    async (profileData: {
      name: string;
      avatar: string;
      statusText?: string;
      phone?: string;
      email?: string;
      uid?: string;
    }) => {
      if (!user) {
        return { error: new Error("No authenticated user to update") };
      }

      try {
        const assignedUid =
          profileData.uid ||
          profile?.uid ||
          generateSystemUid(user.id || user.email || profileData.email);

        await supabase.auth.updateUser({
          data: {
            full_name: profileData.name,
            name: profileData.name,
            avatar_url: profileData.avatar,
            about: profileData.statusText || "Hey there! I am using Six9Chat 🚀",
            status: profileData.statusText || "Hey there! I am using Six9Chat 🚀",
            phone: profileData.phone || "",
            email: profileData.email || user.email || "",
            uid: assignedUid,
          },
        });

        await ensureProfileExists({
          id: user.id,
          full_name: profileData.name,
          avatar_url: profileData.avatar,
          status: profileData.statusText || "Hey there! I am using Six9Chat 🚀",
          phone: profileData.phone || "",
          email: profileData.email || user.email || "",
          uid: assignedUid,
        });

        const updated: UserProfile = {
          id: user.id,
          name: profileData.name,
          status: "online",
          statusText: profileData.statusText || "Hey there! I am using Six9Chat 🚀",
          avatar: profileData.avatar,
          phone: profileData.phone || "",
          email: profileData.email || user.email || "",
          uid: assignedUid,
        };

        setProfile(updated);
        setNeedsOnboarding(false);
        return { error: null };
      } catch (err: unknown) {
        return { error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
    [user, profile]
  );

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user);
    }
  }, [user, loadProfile]);

  const activeUid =
    profile?.uid ||
    (user ? getCurrentUserUid(user.id || user.email || undefined) : getCurrentUserUid());

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated: Boolean(user),
        needsOnboarding,
        currentUserUid: activeUid,
        signInWithEmailOtp: handleSignInWithEmailOtp,
        verifyEmailOtp: handleVerifyEmailOtp,
        signInWithPhone: handleSignInWithPhone,
        signInWithPhoneOtp: handleSignInWithPhone,
        verifyPhoneOtp: handleVerifyPhoneOtp,
        signInWithEmail: handleSignInWithEmail,
        signUpWithEmail: handleSignUpWithEmail,
        signInWithOAuth: handleSignInWithOAuth,
        signOut: handleSignOut,
        saveUserProfile: handleSaveUserProfile,
        refreshProfile,
        setNeedsOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook for consuming AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
