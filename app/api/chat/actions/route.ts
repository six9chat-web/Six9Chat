import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/authService";
import { ensureDatabaseTablesExist } from "@/lib/dbInit";

export async function GET(req: NextRequest) {
  try {
    ensureDatabaseTablesExist().catch(() => {});
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: true, blockedUserIds: [], blockedByUserIds: [] });
    }

    // 1. Users blocked by this user
    const { data: blockedByMe } = await supabaseServer
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", userId);

    // 2. Users who blocked this user
    const { data: blockedMe } = await supabaseServer
      .from("blocked_users")
      .select("blocker_id")
      .eq("blocked_id", userId);

    const blockedUserIds = blockedByMe ? blockedByMe.map((r: { blocked_id: string }) => r.blocked_id) : [];
    const blockedByUserIds = blockedMe ? blockedMe.map((r: { blocker_id: string }) => r.blocker_id) : [];

    return NextResponse.json({
      success: true,
      blockedUserIds,
      blockedByUserIds,
    });
  } catch (error) {
    console.error("[ChatActions GET error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blocked users", blockedUserIds: [], blockedByUserIds: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureDatabaseTablesExist().catch(() => {});
    const body = await req.json();
    const { action, userId, partnerId, conversationId } = body;

    if (!action || !userId || !partnerId) {
      return NextResponse.json(
        { success: false, error: "action, userId, and partnerId are required" },
        { status: 400 }
      );
    }

    const [u1, u2] = [userId, partnerId].sort();

    switch (action) {
      case "block": {
        // Upsert into blocked_users
        const { error } = await supabaseServer.from("blocked_users").upsert(
          {
            blocker_id: userId,
            blocked_id: partnerId,
            created_at: new Date().toISOString(),
          },
          { onConflict: "blocker_id,blocked_id" }
        );

        if (error) {
          console.warn("[ChatActions block notice]:", error);
        }

        return NextResponse.json({ success: true, isBlocked: true });
      }

      case "unblock": {
        // Delete from blocked_users
        const { error } = await supabaseServer
          .from("blocked_users")
          .delete()
          .eq("blocker_id", userId)
          .eq("blocked_id", partnerId);

        if (error) {
          console.warn("[ChatActions unblock notice]:", error);
        }

        return NextResponse.json({ success: true, isBlocked: false });
      }

      case "clear_chat": {
        // 1. Delete message rows matching conversation or 1-on-1 sender/receiver pair
        let deleteQuery = supabaseServer.from("messages").delete();

        if (conversationId && !conversationId.startsWith("contact-") && !conversationId.startsWith("group-")) {
          deleteQuery = deleteQuery.or(
            `conversation_id.eq.${conversationId},and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
          );
        } else {
          deleteQuery = deleteQuery.or(
            `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
          );
        }

        const { error: msgErr } = await deleteQuery;
        if (msgErr) {
          console.warn("[ChatActions clear_chat messages notice]:", msgErr);
        }

        // 2. Reset last_message on conversation
        await supabaseServer
          .from("conversations")
          .update({ last_message: "", updated_at: new Date().toISOString() })
          .or(`and(user1_id.eq.${u1},user2_id.eq.${u2}),and(user1_id.eq.${u2},user2_id.eq.${u1})`);

        return NextResponse.json({ success: true, message: "Chat cleared successfully" });
      }

      case "delete_chat": {
        // Remove conversation entry while preserving chat_requests relationship
        const { error: convErr } = await supabaseServer
          .from("conversations")
          .delete()
          .or(`and(user1_id.eq.${u1},user2_id.eq.${u2}),and(user1_id.eq.${u2},user2_id.eq.${u1})`);

        if (convErr) {
          console.warn("[ChatActions delete_chat notice]:", convErr);
        }

        return NextResponse.json({ success: true, message: "Conversation removed from chat list" });
      }

      case "unfriend": {
        // 1. Update chat_requests status to 'unfriended' (or delete)
        const { error: reqErr } = await supabaseServer
          .from("chat_requests")
          .update({ status: "unfriended", updated_at: new Date().toISOString() })
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`);

        if (reqErr) {
          // If status check constraint rejected 'unfriended', delete row cleanly
          await supabaseServer
            .from("chat_requests")
            .delete()
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`);
        }

        // 2. Remove the conversation entry
        await supabaseServer
          .from("conversations")
          .delete()
          .or(`and(user1_id.eq.${u1},user2_id.eq.${u2}),and(user1_id.eq.${u2},user2_id.eq.${u1})`);

        return NextResponse.json({ success: true, message: "Unfriended user successfully" });
      }

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[ChatActions POST error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
