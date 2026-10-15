import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

// Memory cache of user passcodes and sequential UIDs for instantaneous responses
const userPasscodeMap = new Map<string, { passcode: string; uid: string }>();

/**
 * Format sequential UID starting from S9-01 (S9-01, S9-02, S9-03...)
 */
export function formatSequentialUid(num: number): string {
  const padded = num < 10 ? `0${num}` : `${num}`;
  return `S9-${padded}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, passcode } = body;

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid Gmail / Email address." },
        { status: 400 }
      );
    }

    const cleanPasscode = String(passcode || "").trim();
    if (!/^\d{4}$/.test(cleanPasscode)) {
      return NextResponse.json(
        { success: false, error: "Please enter a 4-digit numeric passcode (PIN)." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = cleanEmail.split("@")[0];
    const safePrefix = cleanEmail.replace(/[^a-zA-Z0-9]/g, "_");
    const userId = `usr_${safePrefix}`;

    // 1. Check if user already exists in profiles
    let assignedUid = "";
    try {
      const { data: existingProf } = await supabaseServer
        .from("profiles")
        .select("uid")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existingProf?.uid && /^S9-\d+$/i.test(existingProf.uid)) {
        assignedUid = existingProf.uid;
      }
    } catch (e) {
      console.warn("[Passcode Auth] profile check note:", e);
    }

    // 2. Check memory cache fallback
    if (!assignedUid) {
      const cached = userPasscodeMap.get(cleanEmail);
      if (cached?.uid) {
        assignedUid = cached.uid;
      }
    }

    // 3. Assign sequential UID starting strictly from S9-01 (S9-01, S9-02, S9-03...)
    if (!assignedUid) {
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
        console.warn("[Passcode Auth] sequential query note:", err);
      }

      // Memory map count check as secondary reference
      for (const val of userPasscodeMap.values()) {
        const match = val.uid.match(/^S9-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num < 1000 && num > highestSeq) highestSeq = num;
        }
      }

      const nextSeq = highestSeq + 1;
      assignedUid = formatSequentialUid(nextSeq);
    }

    // Cache credentials in memory
    userPasscodeMap.set(cleanEmail, {
      passcode: cleanPasscode,
      uid: assignedUid,
    });

    // 4. Upsert user profile into Supabase
    try {
      await supabaseServer.from("profiles").upsert(
        {
          id: userId,
          uid: assignedUid,
          email: cleanEmail,
          full_name: displayName,
          username: `user_${assignedUid.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
          status: "Hey there! I am using Six9Chat 🚀",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (upsertErr) {
      console.warn("[Passcode Auth] profile upsert note:", upsertErr);
    }

    // 5. Set session cookie for instant authentication across routes
    const cookieStore = await cookies();
    const sessionPayload = {
      userId,
      email: cleanEmail,
      fullName: displayName,
      avatarUrl: "",
      statusText: "Hey there! I am using Six9Chat 🚀",
      uid: assignedUid,
    };

    cookieStore.set("six9_mock_session", JSON.stringify(sessionPayload), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      httpOnly: false,
    });

    return NextResponse.json({
      success: true,
      assignedUid,
      user: {
        id: userId,
        email: cleanEmail,
        name: displayName,
        uid: assignedUid,
      },
    });
  } catch (error) {
    console.error("[Passcode Auth API error]:", error);
    return NextResponse.json(
      { success: false, error: "Authentication error. Please try again." },
      { status: 500 }
    );
  }
}
