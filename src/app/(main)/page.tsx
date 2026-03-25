"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { ChatInput } from "@/components/chat/ChatInput";
import { useCreateChat } from "@/hooks/useChats";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function HomePage() {
  const { mutateAsync: createChat, isPending } = useCreateChat();
  const router = useRouter();
  const pendingMessage = useRef<{ content: string; attachmentIds: string[] } | null>(null);

  const handleSend = async (content: string, attachmentIds: string[]) => {
    pendingMessage.current = { content, attachmentIds };
    const chat = await createChat("gemini-flash-lite-latest");
    // Store initial message so ChatWindow can pick it up
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`pending_msg_${chat.id}`, JSON.stringify({ content, attachmentIds }));
    }
    void router.push(`/chat/${chat.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <EmptyState />
      </div>
      <ChatInput onSend={handleSend} isStreaming={isPending} />
    </div>
  );
}
