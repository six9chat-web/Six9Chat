import { NextRequest, NextResponse } from "next/server";
import {
  saveMessage,
  getConversationMessages,
  deleteMessageFromDb,
  deleteMultipleMessagesFromDb,
} from "@/lib/chatService";

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
  } catch (error: unknown) {
    const errObj = error as { digest?: string } | null;
    if (errObj?.digest === "NEXT_PRERENDER_INTERRUPTED") {
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
      replyTo,
      reply_to,
      replyToId,
      reply_to_id,
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
      replyTo: replyTo || reply_to,
      replyToId: replyToId || reply_to_id || replyTo?.id || reply_to?.id,
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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, partnerId, conversationId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const { supabaseServer } = await import("@/lib/authService");

    if (partnerId) {
      await supabaseServer
        .from("messages")
        .update({ is_read: true, status: "read" })
        .eq("receiver_id", userId)
        .eq("sender_id", partnerId)
        .eq("is_read", false);
    }

    if (conversationId) {
      await supabaseServer
        .from("messages")
        .update({ is_read: true, status: "read" })
        .eq("receiver_id", userId)
        .eq("conversation_id", conversationId)
        .eq("is_read", false);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Messages PATCH error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const messageId = searchParams.get("id");
    const idsParam = searchParams.get("ids");

    if (idsParam) {
      const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
      await deleteMultipleMessagesFromDb(ids);
      return NextResponse.json({ success: true, count: ids.length });
    }

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Message id is required" },
        { status: 400 }
      );
    }

    const ok = await deleteMessageFromDb(messageId);
    return NextResponse.json({ success: ok, id: messageId });
  } catch (error) {
    console.error("[Messages DELETE error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete message" },
      { status: 500 }
    );
  }
}


