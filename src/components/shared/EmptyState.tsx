"use client";

import { MessageSquare } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="h-16 w-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
        <MessageSquare className="h-8 w-8 text-[#2563eb]" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white">How can I help you today?</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Start typing a message below to begin a conversation.
        </p>
      </div>
    </div>
  );
}
