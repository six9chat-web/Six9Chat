import { NextRequest, NextResponse } from "next/server";
import { getUserConnectedContacts } from "@/lib/chatService";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: true, contacts: [] });
    }

    const contacts = await getUserConnectedContacts(userId);
    return NextResponse.json({ success: true, contacts });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("[Conversations GET error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load conversations", contacts: [] },
      { status: 500 }
    );
  }
}
