import "server-only";
import { supabase } from "../client";
import { Message, MessageWithAttachments } from "@/types";
import { getSignedUrl } from "@/lib/storage/upload";

export async function createMessage(
  chatId: string,
  role: "user" | "assistant",
  content = ""
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, role, content })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateMessageContent(messageId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ content })
    .eq("id", messageId);

  if (error) throw new Error(error.message);
}

export async function listMessages(chatId: string): Promise<MessageWithAttachments[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*, attachments(*)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return Promise.all(
    (data ?? []).map(async (msg) => ({
      ...msg,
      attachments: await Promise.all(
        (msg.attachments ?? []).map(async (att: { storage_path: string; [key: string]: unknown }) => ({
          ...att,
          signed_url: await getSignedUrl(att.storage_path).catch(() => ""),
        }))
      ),
    }))
  );
}

export async function countMessages(chatId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("chat_id", chatId);

  if (error) return 0;
  return count ?? 0;
}

export async function linkAttachmentsToMessage(attachmentIds: string[], messageId: string): Promise<void> {
  if (!attachmentIds.length) return;
  const { error } = await supabase
    .from("attachments")
    .update({ message_id: messageId })
    .in("id", attachmentIds);

  if (error) throw new Error(error.message);
}
