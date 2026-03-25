"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { MobileSidebarToggle } from "@/components/sidebar/MobileSidebarToggle";
import { AnonymousBanner } from "@/components/shared/AnonymousBanner";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Cross-tab sync via Supabase Realtime
  useRealtime(user?.id ?? null);

  return (
    <div className="flex h-screen bg-[#0d0d0d]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center px-3 py-2 border-b border-[#222]">
          <MobileSidebarToggle onClick={() => setSidebarOpen(true)} />
          <span className="ml-2 text-sm font-medium text-white">ChatBot</span>
        </div>

        {/* Anonymous banner (shown when not logged in) */}
        {!user && <AnonymousBanner />}

        {/* Page content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
