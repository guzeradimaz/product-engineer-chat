"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { AttachmentPreview, PendingAttachment } from "./AttachmentPreview";
import { toast } from "sonner";

const MAX_LENGTH = 32000;

interface Props {
  onSend: (content: string, attachmentIds: string[]) => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isStreaming, disabled }: Props) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if ((!trimmed && attachments.length === 0) || isStreaming || disabled) return;
    onSend(trimmed, attachments.map((a) => a.id));
    setContent("");
    setAttachments([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message ?? "Upload failed");
        return;
      }

      const att = json.data.attachment;
      // For images, create a local preview URL
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

      setAttachments((prev) => [
        ...prev,
        {
          id: att.id,
          file_name: att.file_name,
          file_type: att.file_type,
          signed_url: att.signed_url,
          previewUrl,
        },
      ]);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((i) => i.type.startsWith("image/"));
      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) await uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      await uploadFile(file);
    }
    e.target.value = "";
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
    setContent(el.value);
  };

  const canSend = (content.trim().length > 0 || attachments.length > 0) && !isStreaming && !disabled;

  return (
    <div className="border-t border-[#222] bg-[#0d0d0d]">
      <AttachmentPreview
        attachments={attachments}
        onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
      />

      <div className="flex items-end gap-2 p-3">
        {/* File attach button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || isUploading || disabled}
          className="flex-shrink-0 text-zinc-400 hover:text-white hover:bg-[#1e1e1e] h-9 w-9"
          title="Attach file"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Message ChatBot… (Enter to send, Shift+Enter for newline)"
            disabled={isStreaming || disabled}
            rows={1}
            maxLength={MAX_LENGTH}
            className="resize-none bg-[#1a1a1a] border-[#333] text-white placeholder:text-zinc-500 min-h-[40px] max-h-[200px] pr-16 py-2.5 rounded-xl"
          />
          {content.length > 1000 && (
            <span
              className={`absolute bottom-2 right-3 text-xs ${
                content.length > MAX_LENGTH * 0.9 ? "text-red-400" : "text-zinc-500"
              }`}
            >
              {content.length}/{MAX_LENGTH}
            </span>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className="flex-shrink-0 h-9 w-9 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40"
          title="Send message"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
