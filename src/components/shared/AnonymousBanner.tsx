"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AnonymousBanner() {
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/anonymous", { method: "POST" })
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.questionCount !== undefined) {
          setQuestionCount(json.data.questionCount);
        }
      })
      .catch(() => null);
  }, []);

  if (questionCount === null) return null;

  const remaining = Math.max(0, 3 - questionCount);

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-b border-[#222] text-xs">
      <span className="text-zinc-400">
        {remaining === 0
          ? "You've used all 3 free questions."
          : `${questionCount}/3 free questions used.`}
      </span>
      <Link
        href="/signup"
        className="text-[#2563eb] hover:underline font-medium ml-2 whitespace-nowrap"
      >
        Sign up for unlimited →
      </Link>
    </div>
  );
}
