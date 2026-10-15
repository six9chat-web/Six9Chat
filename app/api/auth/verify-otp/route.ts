import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyOtp, assignSequentialUid, supabaseServer } from "@/lib/otpEngine";

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
    const isValid = await verifyOtp(cleanEmail, cleanToken);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code. Please check your Gmail." },
        { status: 400 }
      );
    }

    // 3. Sequential UID Assignment Starting from S9-01 (S9-01, S9-02, S9-03...)
    const assignedUid = await assignSequentialUid(cleanEmail);

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
