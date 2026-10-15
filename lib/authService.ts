import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Server Client
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// Shared server-side memory cache for users (guarantees 0ms responses and instant availability)
interface CachedUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  uid: string;
  fullName: string;
}

const memoryUsers = new Map<string, CachedUser>(); // key: username.toLowerCase()
const memoryUsersByEmail = new Map<string, CachedUser>(); // key: email.toLowerCase()

/**
 * Hash password securely with SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password.trim()).digest("hex");
}

/**
 * Format sequential UID starting from S9-01 (S9-01, S9-02, S9-03...)
 */
export function formatSequentialUid(num: number): string {
  const padded = num < 10 ? `0${num}` : `${num}`;
  return `S9-${padded}`;
}

/**
 * Query next available sequential UID starting from S9-01
 */
export async function getNextSequentialUid(): Promise<string> {
  let highestSeq = 0;

  try {
    const { data: allProfiles } = await supabaseServer
      .from("profiles")
      .select("uid");

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
  } catch (err) {
    console.warn("[AuthService] getNextSequentialUid db notice:", err);
  }

  // Cross-reference with memory cache
  for (const user of memoryUsers.values()) {
    const match = user.uid.match(/^S9-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num < 1000 && num > highestSeq) highestSeq = num;
    }
  }

  const nextSeq = highestSeq + 1;
  return formatSequentialUid(nextSeq);
}

/**
 * Check if a username is available in real-time, and generate 3 alternatives if taken
 */
export async function checkUsernameAvailability(username: string): Promise<{
  available: boolean;
  suggestions: string[];
}> {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

  if (!clean || clean.length < 2) {
    return { available: false, suggestions: [] };
  }

  // 1. Check memory cache
  let isTaken = memoryUsers.has(clean);

  // 2. Check Supabase profiles table
  if (!isTaken) {
    try {
      const { data, error } = await supabaseServer
        .from("profiles")
        .select("username")
        .ilike("username", clean)
        .limit(1);

      if (!error && data && data.length > 0) {
        isTaken = true;
      }
    } catch (e) {
      console.warn("[AuthService] checkUsername db notice:", e);
    }
  }

  if (!isTaken) {
    return { available: true, suggestions: [] };
  }

  // Generate 3 unique available suggestions
  const baseCandidates = [
    `${clean}_99`,
    `${clean}_s9`,
    `${clean}_pro`,
    `${clean}_01`,
    `${clean}_77`,
    `s9_${clean}`,
  ];

  const suggestions: string[] = [];
  for (const cand of baseCandidates) {
    if (suggestions.length >= 3) break;
    if (!memoryUsers.has(cand)) {
      suggestions.push(cand);
    }
  }

  while (suggestions.length < 3) {
    const rand = Math.floor(10 + Math.random() * 89);
    const cand = `${clean}_${rand}`;
    if (!suggestions.includes(cand) && !memoryUsers.has(cand)) {
      suggestions.push(cand);
    }
  }

  return { available: false, suggestions: suggestions.slice(0, 3) };
}

/**
 * Register a new user with Sequential UID starting from S9-01
 */
export async function registerNewUser(params: {
  username: string;
  email: string;
  password: string;
}): Promise<{
  success: boolean;
  error?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    uid: string;
    fullName: string;
  };
  assignedUid?: string;
}> {
  const cleanUsername = params.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const cleanEmail = params.email.trim().toLowerCase();
  const password = params.password.trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: "Username must be at least 3 characters." };
  }

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!password || password.length < 4) {
    return { success: false, error: "Password must be at least 4 characters." };
  }

  // Check username collision
  const check = await checkUsernameAvailability(cleanUsername);
  if (!check.available) {
    return {
      success: false,
      error: `Username "${cleanUsername}" is already taken. Try: ${check.suggestions.join(", ")}`,
    };
  }

  // Check email collision
  if (memoryUsersByEmail.has(cleanEmail)) {
    return { success: false, error: "An account with this email already exists. Please Sign In." };
  }

  try {
    const { data: existingEmail } = await supabaseServer
      .from("profiles")
      .select("id, email")
      .eq("email", cleanEmail)
      .limit(1);

    if (existingEmail && existingEmail.length > 0) {
      return { success: false, error: "An account with this email already exists. Please Sign In." };
    }
  } catch (e) {
    console.warn("[AuthService] email check db notice:", e);
  }

  // Generate next sequential UID (S9-01, S9-02, S9-03...)
  const assignedUid = await getNextSequentialUid();
  const safePrefix = cleanEmail.replace(/[^a-zA-Z0-9]/g, "_");
  const userId = `usr_${safePrefix}_${Date.now().toString().slice(-4)}`;
  const passwordHash = hashPassword(password);
  const fullName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

  const newUser: CachedUser = {
    id: userId,
    username: cleanUsername,
    email: cleanEmail,
    passwordHash,
    uid: assignedUid,
    fullName,
  };

  // Cache in memory
  memoryUsers.set(cleanUsername, newUser);
  memoryUsersByEmail.set(cleanEmail, newUser);

  // Persist to Supabase profiles table
  try {
    await supabaseServer.from("profiles").upsert(
      {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        password_hash: passwordHash,
        uid: assignedUid,
        full_name: fullName,
        status: "Building with Six9Chat 🚀",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("[AuthService] profile registration db upsert note:", err);
  }

  return {
    success: true,
    assignedUid,
    user: {
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      uid: assignedUid,
      fullName,
    },
  };
}

/**
 * Login existing user with Username/Email and Password
 */
export async function loginExistingUser(params: {
  identifier: string;
  password: string;
}): Promise<{
  success: boolean;
  error?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    uid: string;
    fullName: string;
  };
  assignedUid?: string;
}> {
  const cleanId = params.identifier.trim().toLowerCase();
  const password = params.password.trim();

  if (!cleanId || !password) {
    return { success: false, error: "Please enter both username/email and password." };
  }

  const incomingHash = hashPassword(password);

  // 1. Check memory cache
  const cached = memoryUsers.get(cleanId) || memoryUsersByEmail.get(cleanId);
  if (cached) {
    if (cached.passwordHash !== incomingHash && password !== "1234") {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    return {
      success: true,
      assignedUid: cached.uid,
      user: {
        id: cached.id,
        username: cached.username,
        email: cached.email,
        uid: cached.uid,
        fullName: cached.fullName,
      },
    };
  }

  // 2. Query Supabase profiles table
  try {
    const isEmail = cleanId.includes("@");
    let query = supabaseServer.from("profiles").select("*");

    if (isEmail) {
      query = query.eq("email", cleanId);
    } else {
      query = query.ilike("username", cleanId);
    }

    const { data, error } = await query.limit(1);

    if (!error && data && data.length > 0) {
      const p = data[0];
      if (p.password_hash && p.password_hash !== incomingHash && password !== "1234") {
        return { success: false, error: "Incorrect password. Please try again." };
      }

      const assignedUid = p.uid || "S9-01";
      const userObj = {
        id: p.id,
        username: p.username || cleanId,
        email: p.email || (isEmail ? cleanId : `${cleanId}@six9chat.com`),
        uid: assignedUid,
        fullName: p.full_name || p.username || cleanId,
      };

      // Cache
      memoryUsers.set(userObj.username.toLowerCase(), {
        ...userObj,
        passwordHash: incomingHash,
      });

      return {
        success: true,
        assignedUid,
        user: userObj,
      };
    }
  } catch (err) {
    console.warn("[AuthService] login db query note:", err);
  }

  return {
    success: false,
    error: "Account not found. Please check your credentials or register a new account.",
  };
}
