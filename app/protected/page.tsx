"use client";

import { useState } from "react";
import { useUser } from "@/lib/contexts/user-context";
import { Sidebar } from "@/components/sidebar";
import { TrackerContent } from "@/app/protected/tracker/page";

export default function ProtectedPage() {
  const { displayName } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
              Welcome to your learning dashboard, <span className="text-[#F87171]">{displayName}</span>
            </h1>
            <div className="h-1 w-8 bg-[#F87171] mt-2 rounded-full"></div>
          </div>
          <TrackerContent />
        </div>
      </div>
    </div>
  );
}
