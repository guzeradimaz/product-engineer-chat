"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

async function initAnonSession(): Promise<number | null> {
  // POST is idempotent — creates session if missing, returns current count
  const r = await fetch("/api/auth/anonymous", { method: "POST" });
  const json = await r.json();
  return json.data?.questionCount ?? null;
}

export function AnonymousBanner() {
  const { data } = useQuery({
    queryKey: ["anon-count"],
    queryFn: initAnonSession,
    staleTime: 0,
  });

  if (data === null || data === undefined) return null;

  const remaining = Math.max(0, 3 - data);

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-b border-[#222] text-xs">
      <span className="text-zinc-400">
        {remaining === 0
          ? "You've used all 3 free questions."
          : `${data}/3 free questions used.`}
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
