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
          email: cleanEmail,
          full_name: displayName,
          username: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`,
          about: "Hey there! I am using Six9Chat 🚀",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (profErr) {
      console.warn("[verify-otp profile upsert note]:", profErr);
    }

    // Ensure legacy cookie is removed so headers do not overflow
    const cookieStore = await cookies();
    cookieStore.delete("six9_mock_session");

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
