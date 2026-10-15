import { NextResponse } from "next/server";
import { generate6DigitOtp, storeOtp, dispatchOtpEmail } from "@/lib/otpEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid Gmail or Email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Generate 6-digit numeric OTP code
    const otpCode = generate6DigitOtp();

    // 2. Store in Supabase user_otps database table + memory cache
    await storeOtp(cleanEmail, otpCode);

    // 3. Dispatch OTP to user's Gmail / Email
    const dispatchResult = await dispatchOtpEmail(cleanEmail, otpCode);

    return NextResponse.json(
      {
        success: true,
        message: `6-digit verification code sent to ${cleanEmail}`,
        method: dispatchResult.method,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[send-otp API error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate verification code. Please try again." },
      { status: 500 }
    );
  }
}
