import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOtp, supabaseServer } from "@/lib/otpEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json(
        { success: false, error: "Email and 6-digit code are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanToken = String(token).trim();

    // 1. Verify against Supabase user_otps database engine
    let isValid = await verifyOtp(cleanEmail, cleanToken);

    // 2. Secondary fallback check: Supabase Auth verifyOtp
    if (!isValid) {
      try {
        const { data: supaVerify, error: supaErr } = await supabaseServer.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: "email",
        });
        if (!supaErr && supaVerify?.user) {
          isValid = true;
        }
      } catch (err) {
        console.warn("[verify-otp fallback notice]:", err);
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code. Please check your Gmail." },
        { status: 400 }
      );
    }

    // 3. Sequential UID Assignment Starting from S9-01
    // Query highest sequential UID in profiles
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
    } catch (e) {
      console.warn("[verify-otp UID query notice]:", e);
    }

    const nextSeq = highestSeq + 1;
    const padded = nextSeq < 10 ? `0${nextSeq}` : `${nextSeq}`;
    const assignedUid = `S9-${padded}`;

    // Stable deterministic user ID
    const safePrefix = cleanEmail.replace(/[^a-zA-Z0-9]/g, "_");
    const userId = `usr_${safePrefix}`;
    const displayName = cleanEmail.split("@")[0];

    // 4. Upsert Profile into Supabase profiles table
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
    } catch (profErr) {
      console.warn("[verify-otp profile upsert note]:", profErr);
    }

    // 5. Set session cookie for seamless authentication
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

    return NextResponse.json(
      {
        success: true,
        assignedUid,
        user: {
          id: userId,
          email: cleanEmail,
          name: displayName,
          uid: assignedUid,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[verify-otp API error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal verification error. Please try again." },
      { status: 500 }
    );
  }
}
