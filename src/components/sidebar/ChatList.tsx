"use client";

import { Chat } from "@/types";
import { ChatItem } from "./ChatItem";
import { isToday, isYesterday, subDays, isAfter } from "date-fns";

interface Props {
  chats: Chat[];
  onClose?: () => void;
}

function groupChats(chats: Chat[]) {
  const now = new Date();
  const groups: { label: string; chats: Chat[] }[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Last 7 days", chats: [] },
    { label: "Older", chats: [] },
  ];

  for (const chat of chats) {
    const date = new Date(chat.updated_at);
    if (isToday(date)) {
      groups[0].chats.push(chat);
    } else if (isYesterday(date)) {
      groups[1].chats.push(chat);
    } else if (isAfter(date, subDays(now, 7))) {
      groups[2].chats.push(chat);
    } else {
      groups[3].chats.push(chat);
    }
  }

  return groups.filter((g) => g.chats.length > 0);
}

export function ChatList({ chats, onClose }: Props) {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-zinc-500">No conversations yet</p>
        <p className="text-xs text-zinc-600 mt-1">↑ Click &ldquo;New Chat&rdquo; to start</p>
      </div>
    );
  }

  const groups = groupChats(chats);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-2 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.chats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} onClose={onClose} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
