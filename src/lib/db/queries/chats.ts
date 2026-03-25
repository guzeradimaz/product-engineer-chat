import "server-only";
import { supabase } from "../client";
import { Chat } from "@/types";

export async function createChat(
  ownerId: { userId: string } | { anonId: string },
  model = "gpt-4o"
): Promise<Chat> {
  const insert =
    "userId" in ownerId
      ? { user_id: ownerId.userId, model }
      : { anonymous_session_id: ownerId.anonId, model };

  const { data, error } = await supabase
    .from("chats")
    .insert(insert)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listChats(userId: string): Promise<Chat[]> {
  const { data, error } = await supabase
    .from("chats")
    .select()
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from("chats")
    .select()
    .eq("id", chatId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function updateChat(chatId: string, updates: { title?: string; model?: string }): Promise<Chat> {
  const { data, error } = await supabase
    .from("chats")
    .update(updates)
    .eq("id", chatId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteChat(chatId: string): Promise<void> {
  const { error } = await supabase.from("chats").delete().eq("id", chatId);
  if (error) throw new Error(error.message);
}
