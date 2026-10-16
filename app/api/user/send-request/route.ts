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
        updated_at: new Date().toISOString(),
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
