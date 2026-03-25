import "server-only";
import { supabase } from "../client";
import { AnonSession } from "@/types";
import { randomUUID } from "crypto";

export async function createAnonSession(): Promise<AnonSession> {
  const sessionToken = randomUUID();
  const { data, error } = await supabase
    .from("anonymous_sessions")
    .insert({ session_token: sessionToken })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAnonSessionByToken(token: string): Promise<AnonSession | null> {
  const { data, error } = await supabase
    .from("anonymous_sessions")
    .select()
    .eq("session_token", token)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getAnonSessionById(id: string): Promise<AnonSession | null> {
  const { data, error } = await supabase
    .from("anonymous_sessions")
    .select()
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function incrementAnonCount(id: string): Promise<number> {
  const { data, error } = await supabase
    .from("anonymous_sessions")
    .update({ question_count: supabase.rpc("increment_count" as never) })
    .eq("id", id)
    .select("question_count")
    .single();

  if (error) {
    // Fallback: manual increment
    const { data: current } = await supabase
      .from("anonymous_sessions")
      .select("question_count")
      .eq("id", id)
      .single();

    const newCount = (current?.question_count ?? 0) + 1;
    await supabase
      .from("anonymous_sessions")
      .update({ question_count: newCount })
      .eq("id", id);
    return newCount;
  }

  return data?.question_count ?? 0;
}
