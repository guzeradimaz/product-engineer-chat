"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Chat } from "@/types";
import { useRouter } from "next/navigation";

async function fetchChats(): Promise<Chat[]> {
  const res = await fetch("/api/chats");
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.chats ?? [];
}

export function useChats() {
  return useQuery({
    queryKey: ["chats"],
    queryFn: fetchChats,
    staleTime: 30_000,
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (model: string = "gpt-4o") => {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to create chat");
      return json.data.chat as Chat;
    },
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      void router.push(`/chat/${chat.id}`);
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (chatId: string) => {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json();
        throw new Error(json.error?.message ?? "Failed to delete chat");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      void router.push("/");
    },
  });
}

export function useRenameChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, title }: { chatId: string; title: string }) => {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to rename chat");
      return json.data.chat as Chat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}
