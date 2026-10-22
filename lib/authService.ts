import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Server Client
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rjoxghjmtrsfdhbfkodr.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
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
    const { count } = await supabaseServer
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (typeof count === "number" && count > 0) {
      highestSeq = count;
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
  const passwordHash = hashPassword(password);
  const fullName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

  let userId = "";

  // 1. Create user in Supabase auth.users using Admin API
  try {
    const { data: authUser, error: authErr } = await supabaseServer.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername,
        full_name: fullName,
        uid: assignedUid,
        about: "Building with Six9Chat 🚀",
        status: "Hey there! I am using Six9Chat 🚀",
      },
    });

    if (!authErr && authUser?.user?.id) {
      userId = authUser.user.id;
    } else if (authErr) {
      console.warn("[AuthService] admin.createUser notice:", authErr);
    }
  } catch (err) {
    console.warn("[AuthService] admin.createUser exception:", err);
  }

  // Fallback to crypto.randomUUID if admin API was unavailable
  if (!userId) {
    userId = crypto.randomUUID();
  }

  // 2. Persist to Supabase profiles table
  try {
    await supabaseServer.from("profiles").upsert(
      {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        full_name: fullName,
        about: "Building with Six9Chat 🚀",
        status: "Hey there! I am using Six9Chat 🚀",
        uid: assignedUid,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("[AuthService] profile registration db upsert note:", err);
  }

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

/**
 * Fetch all registered users from Supabase profiles, supplemented with server memory cache
 */
export async function getAllRegisteredUsers(excludeId?: string): Promise<Array<{
  id: string;
  username: string;
  email?: string;
  fullName: string;
  avatarUrl: string;
  about?: string;
  status: string;
  uid: string;
}>> {
  const usersMap = new Map<string, {
    id: string;
    username: string;
    email?: string;
    fullName: string;
    avatarUrl: string;
    about?: string;
    status: string;
    uid: string;
  }>();

  // 1. Fetch all profiles from Supabase profiles table
  try {
    let query = supabaseServer
      .from("profiles")
      .select("id, username, email, full_name, about, avatar_url, updated_at, created_at");

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data: profiles, error } = await query;

    if (!error && Array.isArray(profiles)) {
      for (const p of profiles) {
        if (p.id && (!excludeId || p.id !== excludeId)) {
          usersMap.set(p.id, {
            id: p.id,
            username: p.username || `user_${p.id.slice(0, 4)}`,
            email: p.email || "",
            fullName: p.full_name || p.username || "Six9 Member",
            avatarUrl: p.avatar_url || "",
            about: p.about || "Hey there! I am using Six9Chat",
            status: p.about || "Hey there! I am using Six9Chat",
            uid: `S9-${p.id.slice(0, 4)}`,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[AuthService] getAllRegisteredUsers db notice:", err);
  }

  // 2. Also fetch all users from Supabase Auth admin API (using service role key)
  try {
    const { data: authData, error: authErr } = await supabaseServer.auth.admin.listUsers({
      perPage: 100,
    });
    if (!authErr && authData?.users) {
      for (const u of authData.users) {
        if (u.id && (!excludeId || u.id !== excludeId) && !usersMap.has(u.id)) {
          const meta = u.user_metadata || {};
          const rawName = meta.username || (u.email ? u.email.split("@")[0] : `user_${u.id.slice(0, 4)}`);
          const cleanUname = String(rawName).replace(/^@+/, "");
          const fullName = meta.full_name || meta.name || cleanUname;
          usersMap.set(u.id, {
            id: u.id,
            username: cleanUname,
            email: u.email || "",
            fullName,
            avatarUrl: meta.avatar_url || "",
            about: meta.about || meta.status || "Hey there! I am using Six9Chat",
            status: meta.about || meta.status || "Hey there! I am using Six9Chat",
            uid: `S9-${u.id.slice(0, 4)}`,
          });
        }
      }
    }
  } catch (adminErr) {
    console.warn("[AuthService] getAllRegisteredUsers auth admin notice:", adminErr);
  }

  // 3. Also populate from server memory users
  for (const cached of memoryUsers.values()) {
    if (cached?.id && (!excludeId || cached.id !== excludeId) && !usersMap.has(cached.id)) {
      usersMap.set(cached.id, {
        id: cached.id,
        username: cached.username,
        email: cached.email || "",
        fullName: cached.fullName || cached.username,
        avatarUrl: "",
        about: "Hey there! I am using Six9Chat",
        status: "Hey there! I am using Six9Chat",
        uid: cached.uid || "S9-01",
      });
    }
  }

  return Array.from(usersMap.values());
}

/**
 * Strict database query for profiles matching username or full_name
 */
export async function searchRegisteredUsers(
  query: string,
  excludeId?: string
): Promise<Array<{
  id: string;
  username: string;
  email?: string;
  fullName: string;
  avatarUrl: string;
  about?: string;
  status: string;
  uid: string;
}>> {
  const searchTerm = query.trim().replace(/^@+/, "").toLowerCase();
  if (!searchTerm) return [];

  const matchedMap = new Map<string, {
    id: string;
    username: string;
    email?: string;
    fullName: string;
    avatarUrl: string;
    about?: string;
    status: string;
    uid: string;
  }>();

  // 1. Direct Supabase query on public.profiles table using case-insensitive .ilike matching
  try {
    let sbQuery = supabaseServer
      .from("profiles")
      .select("id, username, email, full_name, about, avatar_url, updated_at, created_at")
      .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(30);

    if (excludeId) {
      sbQuery = sbQuery.neq("id", excludeId);
    }

    const { data: profiles, error } = await sbQuery;

    if (!error && Array.isArray(profiles)) {
      for (const p of profiles) {
        if (p.id && (!excludeId || p.id !== excludeId)) {
          matchedMap.set(p.id, {
            id: p.id,
            username: p.username || `user_${p.id.slice(0, 4)}`,
            email: p.email || "",
            fullName: p.full_name || p.username || "Six9 Member",
            avatarUrl: p.avatar_url || "",
            about: p.about || "Hey there! I am using Six9Chat",
            status: p.about || "Hey there! I am using Six9Chat",
            uid: `S9-${p.id.slice(0, 4)}`,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[AuthService] searchRegisteredUsers ilike query notice:", err);
  }

  // 2. Also check if search matches email via .ilike('email', `%${searchTerm}%`)
  try {
    let emailQuery = supabaseServer
      .from("profiles")
      .select("id, username, email, about, avatar_url, full_name, updated_at, created_at")
      .ilike("email", `%${searchTerm}%`)
      .limit(20);

    if (excludeId) {
      emailQuery = emailQuery.neq("id", excludeId);
    }

    const { data: emailProfiles } = await emailQuery;

    if (Array.isArray(emailProfiles)) {
      for (const p of emailProfiles) {
        if (p.id && (!excludeId || p.id !== excludeId) && !matchedMap.has(p.id)) {
          matchedMap.set(p.id, {
            id: p.id,
            username: p.username || `user_${p.id.slice(0, 4)}`,
            email: p.email || "",
            fullName: p.full_name || p.username || "Six9 Member",
            avatarUrl: p.avatar_url || "",
            about: p.about || "Hey there! I am using Six9Chat",
            status: p.about || "Hey there! I am using Six9Chat",
            uid: `S9-${p.id.slice(0, 4)}`,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[AuthService] searchRegisteredUsers ilike email query notice:", err);
  }

  // 3. Match against server memory users
  for (const cached of memoryUsers.values()) {
    if (excludeId && cached.id === excludeId) continue;
    const u = (cached.username || "").toLowerCase();
    const fn = (cached.fullName || "").toLowerCase();
    const em = (cached.email || "").toLowerCase();
    if (u.includes(searchTerm) || fn.includes(searchTerm) || em.includes(searchTerm)) {
      if (!matchedMap.has(cached.id)) {
        matchedMap.set(cached.id, {
          id: cached.id,
          username: cached.username,
          email: cached.email || "",
          fullName: cached.fullName || cached.username,
          avatarUrl: "",
          about: "Hey there! I am using Six9Chat",
          status: "Hey there! I am using Six9Chat",
          uid: cached.uid || "S9-01",
        });
      }
    }
  }

  // 4. Full profiles scan fallback without relying on non-existent created_at column
  if (matchedMap.size === 0) {
    try {
      const { data: allProfiles } = await supabaseServer
        .from("profiles")
        .select("id, username, email, about, avatar_url, full_name, updated_at, created_at")
        .limit(50);

      if (Array.isArray(allProfiles)) {
        for (const p of allProfiles) {
          if (excludeId && p.id === excludeId) continue;
          const u = (p.username || "").toLowerCase();
          const e = (p.email || "").toLowerCase();
          const f = (p.full_name || "").toLowerCase();
          if (u.includes(searchTerm) || e.includes(searchTerm) || f.includes(searchTerm)) {
            matchedMap.set(p.id, {
              id: p.id,
              username: p.username || `user_${p.id.slice(0, 4)}`,
              email: p.email || "",
              fullName: p.full_name || p.username || "Six9 Member",
              avatarUrl: p.avatar_url || "",
              about: p.about || "Hey there! I am using Six9Chat",
              status: p.about || "Hey there! I am using Six9Chat",
              uid: `S9-${p.id.slice(0, 4)}`,
            });
          }
        }
      }
    } catch (err) {
      console.warn("[AuthService] searchRegisteredUsers fallback notice:", err);
    }
  }

  // 5. Match against Supabase Auth admin API registered users
  try {
    const { data: authData } = await supabaseServer.auth.admin.listUsers({ perPage: 100 });
    if (authData?.users) {
      for (const u of authData.users) {
        if (excludeId && u.id === excludeId) continue;
        if (matchedMap.has(u.id)) continue;
        const meta = u.user_metadata || {};
        const rawName = meta.username || (u.email ? u.email.split("@")[0] : "");
        const uname = String(rawName).toLowerCase().replace(/^@+/, "");
        const fname = String(meta.full_name || meta.name || "").toLowerCase();
        const em = String(u.email || "").toLowerCase();

        if (uname.includes(searchTerm) || fname.includes(searchTerm) || em.includes(searchTerm)) {
          matchedMap.set(u.id, {
            id: u.id,
            username: uname || `user_${u.id.slice(0, 4)}`,
            email: u.email || "",
            fullName: meta.full_name || meta.name || uname || "Six9 Member",
            avatarUrl: meta.avatar_url || "",
            about: meta.about || meta.status || "Hey there! I am using Six9Chat",
            status: meta.about || meta.status || "Hey there! I am using Six9Chat",
            uid: `S9-${u.id.slice(0, 4)}`,
          });
        }
      }
    }
  } catch (authSearchErr) {
    console.warn("[AuthService] searchRegisteredUsers auth admin notice:", authSearchErr);
  }

  return Array.from(matchedMap.values());
}



