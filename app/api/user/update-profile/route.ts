import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/authService";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, username, fullName, statusText, avatarUrl } = body;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("six9_mock_session");
    let currentSession: { userId?: string } | null = null;
    if (sessionCookie?.value) {
      try {
        currentSession = JSON.parse(sessionCookie.value);
      } catch {}
    }

    const targetUserId = userId || currentSession?.userId;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 1. If username update requested
    if (username !== undefined) {
      const cleanUsername = String(username).trim().replace(/[^a-zA-Z0-9_]/g, "");
      if (!cleanUsername || cleanUsername.length < 3) {
        return NextResponse.json(
          { success: false, error: "Username must be at least 3 characters." },
          { status: 400 }
        );
      }

      // Check collision with other users (case-insensitive check)
      try {
        const { data: collision } = await supabaseServer
          .from("profiles")
          .select("id")
          .ilike("username", cleanUsername)
          .neq("id", targetUserId)
          .limit(1);

        if (collision && collision.length > 0) {
          return NextResponse.json(
            { success: false, error: `Username "${cleanUsername}" is already taken.` },
            { status: 400 }
          );
        }
      } catch (err) {
        console.warn("[update-profile username check]:", err);
      }

      updates.username = cleanUsername;
      if (fullName === undefined) {
        updates.full_name = cleanUsername;
      }
    }

    if (fullName !== undefined) {
      updates.full_name = String(fullName).trim();
    }

    if (statusText !== undefined) {
      updates.about = String(statusText).trim();
    }

    if (avatarUrl !== undefined) {
      updates.avatar_url = String(avatarUrl).trim();
    }

    // Persist to Supabase profiles table
    try {
      await supabaseServer
        .from("profiles")
        .update(updates)
        .eq("id", targetUserId);
    } catch (err) {
      console.warn("[update-profile db update]:", err);
    }

    // Update session cookie if available
    if (currentSession) {
      const updatedSession: Record<string, unknown> = {
        ...currentSession,
      };
      if (typeof updates.username === "string") updatedSession.username = updates.username;
      if (typeof updates.full_name === "string") updatedSession.fullName = updates.full_name;
      if (typeof updates.about === "string") updatedSession.statusText = updates.about;
      if (typeof updates.avatar_url === "string") updatedSession.avatarUrl = updates.avatar_url;

      cookieStore.delete("six9_mock_session");
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      updates,
    });
  } catch (error) {
    console.error("[update-profile API error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
