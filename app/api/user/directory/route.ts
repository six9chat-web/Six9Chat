import { NextRequest, NextResponse } from "next/server";
import { getAllRegisteredUsers } from "@/lib/authService";


export async function GET(request: NextRequest) {
  try {
    const excludeId = request.nextUrl.searchParams.get("excludeId") || undefined;
    const users = await getAllRegisteredUsers(excludeId);
    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error: any) {
    if (error?.digest?.startsWith?.("NEXT_")) {
      throw error;
    }
    console.error("Directory API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user directory",
        users: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}

