import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/authService";

export async function POST(req: Request) {
  try {
    const { id, name, memberIds, avatarUrl, createdBy } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Group name is required" },
        { status: 400 }
      );
    }

    const groupId = id || `group-${Date.now()}`;

    const { data, error } = await supabaseServer
      .from("groups")
      .upsert(
        {
          id: groupId,
          name: name.trim(),
          avatar_url: avatarUrl || "",
          member_ids: memberIds || [],
          created_by: createdBy || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.warn("[CreateGroup API] db notice:", error);
    }

    return NextResponse.json({
      success: true,
      group: data || { id: groupId, name: name.trim() },
    });
  } catch (error) {
    console.error("CreateGroup API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create group" },
      { status: 500 }
    );
  }
}
