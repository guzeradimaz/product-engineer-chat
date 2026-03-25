"use client";

import { useMessages, useStreamMessage } from "@/hooks/useMessages";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Props {
  chatId: string;
}

export function ChatWindow({ chatId }: Props) {
  const { data: messages, isLoading } = useMessages(chatId);
  const { isStreaming, streamingContent, error, sendMessage } = useStreamMessage(chatId);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const didAutoSend = useRef(false);

  // Auto-send pending message set from home page
  useEffect(() => {
    if (didAutoSend.current || isLoading) return;
    const key = `pending_msg_${chatId}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    sessionStorage.removeItem(key);
    didAutoSend.current = true;
    const { content, attachmentIds } = JSON.parse(raw);
    void sendMessage(content, attachmentIds);
  }, [chatId, isLoading, sendMessage]);

  const handleSend = async (content: string, attachmentIds: string[]) => {
    const result = await sendMessage(content, attachmentIds);
    if (result?.error === "ANON_LIMIT_REACHED") {
      setShowLimitModal(true);
    } else if (result?.error) {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <MessageList
        messages={messages ?? []}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        isLoading={isLoading}
      />

      {error && error !== "ANON_LIMIT_REACHED" && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-400/10 border-t border-red-400/20">
          Error: {error}
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        isStreaming={isStreaming}
        disabled={showLimitModal}
      />

      {/* Anonymous limit modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle>You&apos;ve used all 3 free questions</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            Create a free account to continue chatting with unlimited messages.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowLimitModal(false)}>
              Maybe later
            </Button>
            <Link href="/signup">
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                Create free account →
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
