import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAnonSessionByToken } from "@/lib/db/queries/anonymous";
import { uploadFile, getSignedUrl } from "@/lib/storage/upload";
import { supabase } from "@/lib/db/client";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES: Record<string, "image" | "document"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "application/pdf": "document",
  "text/plain": "document",
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/plain": "txt",
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    let ownerId: string;
    if (session.type === "user") {
      ownerId = session.userId;
    } else {
      const anonSession = await getAnonSessionByToken(session.anonId);
      if (!anonSession) {
        return NextResponse.json({ error: { message: "Invalid session" } }, { status: 401 });
      }
      ownerId = anonSession.id;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: { message: "No file provided" } }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: { message: "File too large (max 10MB)" } },
        { status: 413 }
      );
    }

    // Validate MIME type
    const mimeType = file.type;
    const fileType = ALLOWED_MIME_TYPES[mimeType];

    if (!fileType) {
      return NextResponse.json(
        { error: { message: "File type not allowed. Allowed: JPEG, PNG, GIF, WebP, PDF, TXT" } },
        { status: 400 }
      );
    }

    // Magic byte validation using file-type
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const { fileTypeFromBuffer } = await import("file-type");
      const detected = await fileTypeFromBuffer(buffer);

      if (detected && !ALLOWED_MIME_TYPES[detected.mime]) {
        return NextResponse.json(
          { error: { message: "File content does not match allowed types" } },
          { status: 400 }
        );
      }
    } catch {
      // file-type might not detect plain text — that's OK
    }

    // Upload to Supabase Storage
    const ext = MIME_TO_EXT[mimeType] ?? "bin";
    const storagePath = `${ownerId}/${randomUUID()}.${ext}`;
    await uploadFile(buffer, storagePath, mimeType);

    // Save attachment record
    const { data: attachment, error } = await supabase
      .from("attachments")
      .insert({
        file_name: file.name,
        file_type: fileType,
        storage_path: storagePath,
        mime_type: mimeType,
        file_size: file.size,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Generate signed URL for immediate preview
    const signedUrl = await getSignedUrl(storagePath);

    return NextResponse.json(
      {
        data: {
          attachment: {
            id: attachment.id,
            file_name: attachment.file_name,
            file_type: attachment.file_type,
            signed_url: signedUrl,
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/uploads]", err);
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}
