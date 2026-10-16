import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loginExistingUser } from "@/lib/authService";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { identifier, password } = body;

    const result = await loginExistingUser({ identifier, password });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to sign in." },
        { status: 400 }
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    const sessionPayload = {
      userId: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      username: result.user.username,
      avatarUrl: "",
      statusText: "Building with Six9Chat 🚀",
      uid: result.assignedUid,
    };

    cookieStore.set("six9_mock_session", JSON.stringify(sessionPayload), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year persistent session
      sameSite: "lax",
      httpOnly: false,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[login API error]:", err);
    return NextResponse.json(
      { success: false, error: "Sign in error. Please try again." },
      { status: 500 }
    );
  }
}
