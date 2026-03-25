"use client";

import { Menu } from "lucide-react";

interface Props {
  onClick: () => void;
}

export function MobileSidebarToggle({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="md:hidden rounded p-2 text-zinc-400 hover:text-white hover:bg-[#1e1e1e] transition-colors"
      aria-label="Open sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
