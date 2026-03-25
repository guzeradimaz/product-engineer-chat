import "server-only";
import { supabase } from "../client";
import { User } from "@/types";

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .insert({ email, password_hash: passwordHash })
    .select("id, email, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function findUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, password_hash, created_at")
    .eq("email", email)
    .single();

  if (error || !data) return null;
  return data;
}

export async function findUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, created_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}
