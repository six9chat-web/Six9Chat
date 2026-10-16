import { NextResponse } from "next/server";
import { toggleMessageReaction } from "@/lib/chatService";

export async function POST(req: Request) {
  try {
    const { messageId, emoji, userId } = await req.json();

    if (!messageId || !emoji) {
      return NextResponse.json(
        { success: false, error: "messageId and emoji are required" },
        { status: 400 }
      );
    }

    const result = await toggleMessageReaction(messageId, emoji, userId || "self");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Reactions POST error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update reaction" },
      { status: 500 }
    );
  }
}
