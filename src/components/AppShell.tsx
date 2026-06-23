"use client";

import { Nav } from "@/components/Nav";
import { usePathname } from "next/navigation";

const PUBLIC_LAYOUT_ROUTES = ["/", "/login", "/setup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicLayout =
    PUBLIC_LAYOUT_ROUTES.includes(pathname) || pathname.startsWith("/auth");

  if (isPublicLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Nav />
      <main className="flex-1 p-5 lg:p-8 overflow-auto">{children}</main>
    </div>
  );
}
