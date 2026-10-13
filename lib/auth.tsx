"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { UserProfile } from "@/types/chat";
import { CURRENT_USER } from "@/lib/mockData";

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  status: string;
  phone: string;
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
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  signInWithPhone: (phone: string) => Promise<{ error: AuthError | Error | null; data: any }>;
  signInWithPhoneOtp: (phone: string) => Promise<{ error: AuthError | Error | null; data: any }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: AuthError | Error | null; data: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | Error | null; data: any }>;
  signUpWithEmail: (
    param1: string | SignUpParams,
    param2?: string,
    param3?: any
  ) => Promise<{ error: AuthError | Error | null; data: any }>;
  signInWithOAuth: (provider: "github" | "google") => Promise<{ error: AuthError | Error | null; data: any }>;
  signOut: () => Promise<void>;
  saveUserProfile: (profileData: {
    name: string;
    avatar: string;
    statusText?: string;
    phone?: string;
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
  param3?: any
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
    fullName = typeof param3 === "string" ? param3 : param3?.full_name || param3?.name || "";
    phone = param3?.phone || "";
    avatarUrl = param3?.avatar_url || "";
  }

  if (!password) {
    throw new Error("Password is required for email signup");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split("@")[0],
        name: fullName || email.split("@")[0],
        username: username || email.split("@")[0].toLowerCase(),
        phone: phone || "",
        avatar_url: avatarUrl || "",
        status: status,
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
        avatar_url: avatarUrl || "",
        phone: phone || "",
        status: status,
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

/**
 * Standalone: Sign out current session
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
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
    if (error || !session) return null;
    return session;
  } catch {
    return null;
  }
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

    if (error) {
      console.warn("Error fetching profile from profiles table:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn("Exception fetching profile:", err);
    return null;
  }
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

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.warn("Could not update profile table:", error.message);
    await supabase.auth.updateUser({
      data: updates,
    });
    return null;
  }

  return data;
}

/**
 * Standalone: Ensure a profile row exists in public.profiles
 */
export async function ensureProfileExists(profile: Partial<Profile> & { id: string }) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: profile.id,
        username: profile.username || `user_${profile.id.slice(0, 6)}`,
        full_name: profile.full_name || "Six9Chat Member",
        avatar_url: profile.avatar_url || "",
        phone: profile.phone || "",
        status: profile.status || "Hey there! I am using Six9Chat",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .maybeSingle();

  if (error) {
    console.warn("ensureProfileExists notice:", error.message);
  }
  return data;
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

  if (uploadError) {
    console.warn("Storage upload failed, using Data URL fallback:", uploadError.message);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return data.publicUrl;
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

      const name =
        dbProfile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split("@")[0] ||
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
      };

      setProfile(loadedProfile);

      // Check if user requires onboarding
      if (!name || name === "Six9 Member" || name.startsWith("+")) {
        setNeedsOnboarding(true);
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

        setSession(initialSession);
        setUser(initialSession?.user || null);

        if (initialSession?.user) {
          await loadProfile(initialSession.user);
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

      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        await loadProfile(newSession.user);
      } else {
        setProfile(null);
        setNeedsOnboarding(false);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Context Actions
  const handleSignInWithPhone = useCallback(async (phoneNumber: string) => {
    try {
      const data = await signInWithPhoneOtp(phoneNumber);
      return { error: null, data };
    } catch (err: any) {
      return { error: err, data: null };
    }
  }, []);

  const handleVerifyPhoneOtp = useCallback(async (phoneNumber: string, token: string) => {
    try {
      const data = await verifyPhoneOtp(phoneNumber, token);
      return { error: null, data };
    } catch (err: any) {
      return { error: err, data: null };
    }
  }, []);

  const handleSignInWithEmail = useCallback(async (email: string, pass: string) => {
    try {
      const data = await signInWithEmail(email, pass);
      return { error: null, data };
    } catch (err: any) {
      return { error: err, data: null };
    }
  }, []);

  const handleSignUpWithEmail = useCallback(
    async (param1: string | SignUpParams, param2?: string, param3?: any) => {
      try {
        const data = await signUpWithEmail(param1, param2, param3);
        return { error: null, data };
      } catch (err: any) {
        return { error: err, data: null };
      }
    },
    []
  );

  const handleSignInWithOAuth = useCallback(async (provider: "github" | "google") => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      return { error: null, data };
    } catch (err: any) {
      return { error: err, data: null };
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
    }) => {
      if (!user) {
        return { error: new Error("No authenticated user to update") };
      }

      try {
        await supabase.auth.updateUser({
          data: {
            full_name: profileData.name,
            name: profileData.name,
            avatar_url: profileData.avatar,
            about: profileData.statusText || "Hey there! I am using Six9Chat 🚀",
            status: profileData.statusText || "Hey there! I am using Six9Chat 🚀",
            phone: profileData.phone || "",
          },
        });

        await ensureProfileExists({
          id: user.id,
          full_name: profileData.name,
          avatar_url: profileData.avatar,
          status: profileData.statusText || "Hey there! I am using Six9Chat 🚀",
          phone: profileData.phone || "",
        });

        const updated: UserProfile = {
          id: user.id,
          name: profileData.name,
          status: "online",
          statusText: profileData.statusText || "Hey there! I am using Six9Chat 🚀",
          avatar: profileData.avatar,
          phone: profileData.phone || "",
        };

        setProfile(updated);
        setNeedsOnboarding(false);
        return { error: null };
      } catch (err: any) {
        return { error: err };
      }
    },
    [user]
  );

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user);
    }
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated: Boolean(user),
        needsOnboarding,
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
