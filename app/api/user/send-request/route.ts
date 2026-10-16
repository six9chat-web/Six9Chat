import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/authService";

export async function POST(req: Request) {
  try {
    const { senderId, receiverId, message } = await req.json();

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { success: false, error: "Sender and Receiver ID required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("chat_requests")
      .upsert(
        {
          sender_id: senderId,
          receiver_id: receiverId,
          status: "pending",
          message: message || "wants to start a conversation with you",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "sender_id,receiver_id" }
      )
      .select()
      .single();

    if (error) {
      console.warn("[SendRequest API] db notice:", error);
    }

    return NextResponse.json({
      success: true,
      request: data,
    });
  } catch (error) {
    console.error("SendRequest API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send request" },
      { status: 500 }
    );
  }
}
