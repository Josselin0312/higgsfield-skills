"use client";

import { useAccount } from "@/lib/accountStore";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { activeAccount } = useAccount();

  if (!activeAccount) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen">{children}</main>
    </div>
  );
}
