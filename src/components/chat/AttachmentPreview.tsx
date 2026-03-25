"use client";

import { X } from "lucide-react";
import Image from "next/image";

export interface PendingAttachment {
  id: string;
  file_name: string;
  file_type: "image" | "document";
  signed_url: string;
  previewUrl?: string;
}

interface Props {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
}

export function AttachmentPreview({ attachments, onRemove }: Props) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 border-t border-[#333]">
      {attachments.map((att) => (
        <div key={att.id} className="relative group">
          {att.file_type === "image" ? (
            <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-[#1a1a1a]">
              <Image
                src={att.previewUrl ?? att.signed_url}
                alt={att.file_name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-zinc-300 max-w-[150px]">
              <span className="text-base">📄</span>
              <span className="truncate">{att.file_name}</span>
            </div>
          )}

          <button
            onClick={() => onRemove(att.id)}
            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#333] text-zinc-300 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
