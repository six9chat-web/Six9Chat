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
        },
        { onConflict: "sender_id,receiver_id" }
      )
      .select()
      .maybeSingle();

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

export async function PATCH(req: Request) {
  try {
    const { requestId, status } = await req.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { success: false, error: "requestId and status required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("chat_requests")
      .update({
        status,
      })
      .eq("id", requestId)
      .select()
      .maybeSingle();

    if (error) {
      console.warn("[SendRequest PATCH API] db notice:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // When accepted, automatically guarantee the conversation row exists in conversations table
    if (status === "accepted" && data?.sender_id && data?.receiver_id) {
      try {
        const [user1_id, user2_id] = [data.sender_id, data.receiver_id].sort();
        await supabaseServer.from("conversations").upsert(
          {
            user1_id,
            user2_id,
            last_message: "Chat request accepted. Say hi! 👋",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user1_id,user2_id" }
        );
      } catch (convErr) {
        console.warn("[SendRequest PATCH] conversation upsert note:", convErr);
      }
    }

    return NextResponse.json({
      success: true,
      request: data,
    });
  } catch (error) {
    console.error("SendRequest PATCH API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update request" },
      { status: 500 }
    );
  }
}
