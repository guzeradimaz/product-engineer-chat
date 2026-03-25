"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Chat } from "@/types";
import { useDeleteChat, useRenameChat } from "@/hooks/useChats";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  chat: Chat;
  onClose?: () => void;
}

export function ChatItem({ chat, onClose }: Props) {
  const pathname = usePathname();
  const isActive = pathname === `/chat/${chat.id}`;
  const deleteChat = useDeleteChat();
  const renameChat = useRenameChat();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);

  const handleDelete = async () => {
    try {
      await deleteChat.mutateAsync(chat.id);
      setShowDeleteDialog(false);
      onClose?.();
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  const handleRename = async () => {
    if (!newTitle.trim()) return;
    try {
      await renameChat.mutateAsync({ chatId: chat.id, title: newTitle.trim() });
      setShowRenameDialog(false);
    } catch {
      toast.error("Failed to rename chat");
    }
  };

  return (
    <>
      <div
        className={`group relative flex items-center rounded-lg px-2 py-2 text-sm transition-colors ${
          isActive
            ? "bg-[#2a2a2a] text-white"
            : "text-zinc-300 hover:bg-[#1e1e1e] hover:text-white"
        }`}
      >
        <Link
          href={`/chat/${chat.id}`}
          className="flex-1 truncate"
          onClick={onClose}
        >
          {chat.title}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={`ml-1 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#333] text-zinc-400 hover:text-white ${
              isActive ? "opacity-100" : ""
            }`}
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#333] text-white">
            <DropdownMenuItem
              className="cursor-pointer hover:bg-[#2a2a2a]"
              onClick={() => {
                setNewTitle(chat.title);
                setShowRenameDialog(true);
              }}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-red-400 hover:bg-[#2a2a2a] hover:text-red-400"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            &ldquo;{chat.title}&rdquo; will be permanently deleted.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteChat.isPending}
            >
              {deleteChat.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-[#2a2a2a] border-[#444] text-white"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={renameChat.isPending}
              className="bg-[#2563eb] hover:bg-[#1d4ed8]"
            >
              {renameChat.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
