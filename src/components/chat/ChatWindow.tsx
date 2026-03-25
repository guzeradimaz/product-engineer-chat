"use client";

import { useMessages, useStreamMessage } from "@/hooks/useMessages";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

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

  const nonEmptyMessages = (messages ?? []).filter((m) => m.content || m.attachments?.length);
  const lastAssistantMsg = [...(messages ?? [])].reverse().find((m) => m.role === "assistant" && m.content);

  const handleRegenerate = () => {
    if (!lastAssistantMsg || isStreaming) return;
    const lastUserMsg = [...(messages ?? [])].reverse().find((m) => m.role === "user");
    if (lastUserMsg) handleSend(lastUserMsg.content, []);
  };

  return (
    <div className="flex flex-col h-full">
      {!isLoading && nonEmptyMessages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
          <div className="h-12 w-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-[#2563eb]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Start the conversation</p>
            <p className="text-xs text-zinc-500 mt-0.5">Send a message to begin</p>
          </div>
        </div>
      )}

      {(isLoading || nonEmptyMessages.length > 0) && (
        <MessageList
          messages={messages ?? []}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          isLoading={isLoading}
        />
      )}

      {lastAssistantMsg && !isStreaming && nonEmptyMessages.length > 0 && (
        <div className="flex justify-center pb-1">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1a1a1a]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            Regenerate response
          </button>
        </div>
      )}

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
