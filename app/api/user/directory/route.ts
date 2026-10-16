import { NextResponse } from "next/server";
import { getAllRegisteredUsers } from "@/lib/authService";

export async function GET() {
  try {
    const users = await getAllRegisteredUsers();
    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Directory API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user directory",
        users: [],
      },
      { status: 500 }
    );
  }
}
