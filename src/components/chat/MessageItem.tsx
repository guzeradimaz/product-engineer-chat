"use client";

import { useState } from "react";
import { MessageWithAttachments } from "@/types";
import { MarkdownContent } from "./MarkdownContent";
import { Copy, Check } from "lucide-react";
import Image from "next/image";

interface Props {
  message: MessageWithAttachments;
}

export function MessageItem({ message }: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 ${
          isUser ? "bg-[#1e3a5f]" : "bg-[#2563eb]"
        }`}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 max-w-[85%] ${isUser ? "items-end" : ""}`}>
        {/* Attachments (images) */}
        {message.attachments?.filter((a) => a.file_type === "image" && a.signed_url).map((att) => (
          <div key={att.id} className="mb-2">
            <Image
              src={att.signed_url!}
              alt={att.file_name}
              width={300}
              height={200}
              className="rounded-lg max-w-xs object-cover"
            />
          </div>
        ))}

        {/* Document attachments */}
        {message.attachments?.filter((a) => a.file_type === "document").map((att) => (
          <div key={att.id} className="mb-2 flex items-center gap-2 bg-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-zinc-300 max-w-xs">
            <span className="text-lg">📄</span>
            <span className="truncate">{att.file_name}</span>
          </div>
        ))}

        {/* Message bubble */}
        {message.content && (
          <div
            className={`relative rounded-2xl px-4 py-3 text-sm ${
              isUser
                ? "bg-[#1e3a5f] text-white rounded-tr-sm ml-auto"
                : "bg-[#1a1a1a] text-zinc-100 rounded-tl-sm"
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            ) : (
              <MarkdownContent content={message.content} />
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="absolute -bottom-6 right-0 flex items-center gap-1 text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-zinc-300"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-400" />
                  <span className="text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
