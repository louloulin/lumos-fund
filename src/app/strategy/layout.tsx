import React from "react";
import { Sidebar } from "@/components/Sidebar";

export default function StrategyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="flex-1 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
} 