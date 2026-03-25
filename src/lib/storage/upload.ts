import "server-only";
import { supabase } from "@/lib/db/client";

const BUCKET = "attachments";

export async function uploadFile(
  buffer: Buffer,
  path: string,
  mimeType: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return path;
}

export async function getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data) throw new Error("Failed to generate signed URL");
  return data.signedUrl;
}

export async function downloadFile(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) throw new Error("Failed to download file");
  return Buffer.from(await data.arrayBuffer());
}
