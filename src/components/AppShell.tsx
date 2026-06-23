"use client";

import { Nav } from "@/components/Nav";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/setup");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Nav />
      <main className="flex-1 p-5 lg:p-8 overflow-auto">{children}</main>
    </div>
  );
}
