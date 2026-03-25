"use client";

import { useEffect, useRef, useState } from "react";
import { MessageWithAttachments } from "@/types";
import { MessageItem } from "./MessageItem";
import { StreamingMessage } from "./StreamingMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";

interface Props {
  messages: MessageWithAttachments[];
  optimisticMessage?: string | null;
  streamingContent: string;
  isStreaming: boolean;
  isLoading: boolean;
}

export function MessageList({ messages, optimisticMessage, streamingContent, isStreaming, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: isStreaming ? "instant" : "smooth" });
    }
  }, [messages.length, streamingContent, autoScroll, isStreaming]);

  // Detect manual scroll
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(atBottom);
    setShowScrollBtn(!atBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setAutoScroll(true);
    setShowScrollBtn(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
            <Skeleton className="h-7 w-7 rounded-full bg-[#1a1a1a] flex-shrink-0" />
            <Skeleton
              className={`h-16 bg-[#1a1a1a] rounded-2xl ${i % 2 === 0 ? "w-48" : "w-64"}`}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 space-y-6"
      >
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {optimisticMessage && (
          <div className="flex gap-3 flex-row-reverse animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold mt-0.5">U</div>
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#1e3a5f] px-4 py-3 text-sm text-white">
              <p className="whitespace-pre-wrap leading-relaxed">{optimisticMessage}</p>
            </div>
          </div>
        )}

        {isStreaming && streamingContent && (
          <StreamingMessage content={streamingContent} />
        )}

        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-xs font-bold">
              AI
            </div>
            <div className="flex items-center gap-1 pt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 rounded-full bg-[#1a1a1a] border border-[#333] p-2 text-zinc-400 hover:text-white hover:bg-[#2a2a2a] shadow-lg transition-all"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
