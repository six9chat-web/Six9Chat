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

    // Ensure legacy cookie is removed so headers do not overflow
    const cookieStore = await cookies();
    cookieStore.delete("six9_mock_session");

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[login API error]:", err);
    return NextResponse.json(
      { success: false, error: "Sign in error. Please try again." },
      { status: 500 }
    );
  }
}
