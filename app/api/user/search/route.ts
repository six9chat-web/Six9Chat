import { NextRequest, NextResponse } from "next/server";
import { searchRegisteredUsers } from "@/lib/authService";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ success: true, users: [] });
    }

    const users = await searchRegisteredUsers(query);
    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    if (error?.digest?.startsWith?.("NEXT_")) {
      throw error;
    }
    console.error("[user search API error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
        users: [],
      },
      { status: 500 }
    );
  }
}
