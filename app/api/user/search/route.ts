import { NextRequest, NextResponse } from "next/server";
import { searchRegisteredUsers } from "@/lib/authService";

export async function GET(request: NextRequest) {
  try {
    const searchTerm =
      request.nextUrl.searchParams.get("searchTerm") ||
      request.nextUrl.searchParams.get("username") ||
      request.nextUrl.searchParams.get("q") ||
      "";

    if (!searchTerm.trim()) {
      return NextResponse.json({ success: true, users: [] });
    }

    const excludeId = request.nextUrl.searchParams.get("excludeId") || undefined;
    const users = await searchRegisteredUsers(searchTerm, excludeId);
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
