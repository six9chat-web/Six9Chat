import { NextResponse } from "next/server";
import { checkUsernameAvailability } from "@/lib/authService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || "";

    const result = await checkUsernameAvailability(username);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[check-username API error]:", err);
    return NextResponse.json({ available: false, suggestions: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = body.username || "";

    const result = await checkUsernameAvailability(username);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[check-username API error]:", err);
    return NextResponse.json({ available: false, suggestions: [] }, { status: 500 });
  }
}
