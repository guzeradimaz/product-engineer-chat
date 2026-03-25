"use client";

import { MarkdownContent } from "./MarkdownContent";

interface Props {
  content: string;
}

export function StreamingMessage({ content }: Props) {
  return (
    <div className="flex gap-3">
      {/* Bot avatar */}
      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-xs font-bold mt-0.5">
        AI
      </div>
      <div className="flex-1 min-w-0">
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm text-zinc-100 leading-relaxed m-0">
            {content}
            <span className="inline-block w-0.5 h-4 bg-white ml-0.5 animate-pulse align-middle" />
          </p>
        </div>
      </div>
    </div>
  );
}
