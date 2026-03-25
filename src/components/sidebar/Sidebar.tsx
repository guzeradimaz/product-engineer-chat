"use client";

import { Plus, MessageSquare, LogOut, LogIn, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatList } from "./ChatList";
import { useChats, useCreateChat } from "@/hooks/useChats";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { useState } from "react";
import { LLMModel } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: chats, isLoading: chatsLoading } = useChats();
  const createChat = useCreateChat();
  const logout = useLogout();
  const [selectedModel, setSelectedModel] = useState<LLMModel>("gpt-4o");

  const handleNewChat = () => {
    createChat.mutate(selectedModel);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-30 flex flex-col w-64 bg-[#111111] border-r border-[#222] transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#222]">
          <Link href="/" className="flex items-center gap-2 text-white font-semibold">
            <MessageSquare className="h-5 w-5 text-[#2563eb]" />
            <span>ChatBot</span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden rounded p-1 text-zinc-400 hover:text-white hover:bg-[#2a2a2a]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Model selector + New Chat */}
        <div className="p-3 space-y-2 border-b border-[#222]">
          <ModelSelector value={selectedModel} onChange={setSelectedModel} />
          <Button
            onClick={handleNewChat}
            disabled={createChat.isPending}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1 px-2 py-3">
          {authLoading || !user ? (
            user === null && !authLoading ? (
              <div className="px-2 py-4 text-center">
                <p className="text-xs text-zinc-500">Sign in to save your conversations</p>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="mt-2 text-[#2563eb] w-full">
                    Sign in
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2 px-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full bg-[#1a1a1a]" />
                ))}
              </div>
            )
          ) : chatsLoading ? (
            <div className="space-y-2 px-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full bg-[#1a1a1a]" />
              ))}
            </div>
          ) : (
            <ChatList chats={chats ?? []} onClose={onClose} />
          )}
        </ScrollArea>

        {/* User menu */}
        <div className="border-t border-[#222] p-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-[#2563eb] text-xs text-white">
                  {user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-xs text-zinc-300">{user.email}</span>
              <button
                onClick={() => logout.mutate()}
                className="rounded p-1 text-zinc-400 hover:text-white hover:bg-[#2a2a2a]"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-zinc-400 hover:text-white gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
