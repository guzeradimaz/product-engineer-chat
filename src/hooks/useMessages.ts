"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageWithAttachments } from "@/types";
import { useState, useCallback, useRef } from "react";

async function fetchMessages(chatId: string): Promise<MessageWithAttachments[]> {
  const res = await fetch(`/api/chats/${chatId}/messages`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.messages ?? [];
}

export function useMessages(chatId: string) {
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => fetchMessages(chatId),
    staleTime: 10_000,
    enabled: !!chatId,
  });
}

export interface StreamState {
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
}

export function useStreamMessage(chatId: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    streamingContent: "",
    error: null,
  });

  const accumulatedRef = useRef("");
  const rafRef = useRef<number | null>(null);

  const sendMessage = useCallback(
    async (content: string, attachmentIds: string[] = []) => {
      accumulatedRef.current = "";
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setState({ isStreaming: true, streamingContent: "", error: null });

      try {
        const res = await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, attachmentIds }),
        });

        if (!res.ok) {
          const json = await res.json();
          const code = json.error?.code;
          const message = json.error?.message ?? "Failed to send message";
          setState({ isStreaming: false, streamingContent: "", error: code ?? message });
          return { error: code ?? message };
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const flushToState = () => {
          setState((prev) => ({ ...prev, streamingContent: accumulatedRef.current }));
          rafRef.current = null;
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6);
            if (raw === "[DONE]") break;

            try {
              const event = JSON.parse(raw);
              if (event.type === "chunk") {
                accumulatedRef.current += event.content;
                if (!rafRef.current) {
                  rafRef.current = requestAnimationFrame(flushToState);
                }
              }
              if (event.type === "done") {
                queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
                queryClient.invalidateQueries({ queryKey: ["anon-count"] });
              }
              if (event.type === "error") {
                setState({ isStreaming: false, streamingContent: "", error: event.message });
                return { error: event.message };
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setState({ isStreaming: false, streamingContent: "", error: null });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection failed";
        setState({ isStreaming: false, streamingContent: "", error: message });
        return { error: message };
      }
    },
    [chatId, queryClient]
  );

  return { ...state, sendMessage };
}
