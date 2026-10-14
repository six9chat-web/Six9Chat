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

export interface MockSessionData {
  userId: string;
  phone: string;
  fullName?: string;
  avatarUrl?: string;
  statusText?: string;
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
    const rawLocal = localStorage.getItem("six9_mock_session");
    if (rawLocal) {
      return JSON.parse(rawLocal);
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
    document.cookie = `six9_mock_session=${encodeURIComponent(json)}; path=/; max-age=604800; SameSite=Lax`;
    localStorage.setItem("six9_mock_session", json);
  } catch (e) {
    console.warn("Failed to set mock session:", e);
  }
}

export function clearMockSession() {
  if (typeof window === "undefined") return;
  try {
    document.cookie = "six9_mock_session=; path=/; max-age=0; SameSite=Lax";
    localStorage.removeItem("six9_mock_session");
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
          username: `user_${mock.userId.slice(0, 6)}`,
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
    status: profile.status || "Hey there! I am using Six9Chat",
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

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await loadProfile(initialSession.user);
        } else {
          // Check for active local mock session
          const mock = getMockSession();
          if (mock) {
            const mockUser = {
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

            const mockSess = {
              access_token: "mock-token",
              refresh_token: "mock-refresh",
              expires_in: 604800,
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
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
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
      } catch (err: unknown) {
        return { error: err instanceof Error ? err : new Error(String(err)) };
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
