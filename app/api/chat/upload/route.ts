import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/authService";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const mimeType = file.type || "application/octet-stream";
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    let mediaType: "image" | "video" | "audio" | "document" = "document";
    if (mimeType.startsWith("image/")) mediaType = "image";
    else if (mimeType.startsWith("video/")) mediaType = "video";
    else if (mimeType.startsWith("audio/")) mediaType = "audio";

    const fileSizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

    let publicUrl: string | null = null;

    // 1. Try uploading to Supabase Storage 'chat-attachments' bucket
    try {
      const { data, error } = await supabaseServer.storage
        .from("chat-attachments")
        .upload(safeName, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error && (error as any).message?.toLowerCase().includes("not found")) {
        await supabaseServer.storage.createBucket("chat-attachments", { public: true });
        const retry = await supabaseServer.storage
          .from("chat-attachments")
          .upload(safeName, buffer, {
            contentType: mimeType,
            upsert: true,
          });
        if (!retry.error && retry.data?.path) {
          const { data: pubData } = supabaseServer.storage
            .from("chat-attachments")
            .getPublicUrl(retry.data.path);
          publicUrl = pubData.publicUrl;
        }
      } else if (!error && data?.path) {
        const { data: pubData } = supabaseServer.storage
          .from("chat-attachments")
          .getPublicUrl(data.path);
        publicUrl = pubData.publicUrl;
      }
    } catch (e) {
      console.warn("[Upload API] Supabase storage notice:", e);
    }

    // 2. If storage bucket not configured or returned error, provide high-performance DataURL fallback
    if (!publicUrl) {
      publicUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: fileSizeStr,
      mediaType,
    });
  } catch (error) {
    console.error("[Upload API error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload media" },
      { status: 500 }
    );
  }
}
