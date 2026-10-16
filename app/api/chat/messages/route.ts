import { NextRequest, NextResponse } from "next/server";
import { saveMessage, getConversationMessages } from "@/lib/chatService";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId") || "";
    const userA = searchParams.get("userA") || undefined;
    const userB = searchParams.get("userB") || undefined;

    if (!conversationId && (!userA || !userB)) {
      return NextResponse.json({ success: true, messages: [] });
    }

    const messages = await getConversationMessages(conversationId, userA, userB);
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("[Messages GET error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load messages", messages: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      conversationId,
      senderId,
      receiverId,
      senderName,
      senderAvatar,
      text,
      mediaType,
      mediaUrl,
      mediaMeta,
      reactions,
      status,
      createdAt,
    } = body;

    if (!id || !senderId) {
      return NextResponse.json(
        { success: false, error: "id and senderId are required" },
        { status: 400 }
      );
    }

    const saved = await saveMessage({
      id,
      conversationId: conversationId || receiverId,
      senderId,
      receiverId,
      senderName,
      senderAvatar,
      text: text || "",
      mediaType: mediaType || "text",
      mediaUrl,
      mediaMeta,
      reactions: reactions || [],
      status: status || "delivered",
      createdAt,
    });

    return NextResponse.json({ success: true, message: saved });
  } catch (error) {
    console.error("[Messages POST error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save message" },
      { status: 500 }
    );
  }
}
