import { NextRequest, NextResponse } from "next/server";
import { getUserConnectedContacts, getOrCreateConversation } from "@/lib/chatService";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, partnerId } = body;

    if (!userId || !partnerId) {
      return NextResponse.json(
        { success: false, error: "userId and partnerId are required" },
        { status: 400 }
      );
    }

    const conversation = await getOrCreateConversation(userId, partnerId);
    return NextResponse.json({ success: true, conversation });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("[Conversations POST error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get or create conversation" },
      { status: 500 }
    );
  }
}
