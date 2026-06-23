"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/SignOutButton";

const links = [
  { href: "/", label: "Dashboard", icon: "◈" },
  { href: "/trades", label: "Trades", icon: "↗" },
  { href: "/journal", label: "Journal", icon: "✎" },
  { href: "/coach", label: "Wendy Coach", icon: "★" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Nav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((data) => setIsAdmin(Boolean(data.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, []);

  const allLinks = isAdmin
    ? [...links, { href: "/admin/users", label: "Users", icon: "👥" }]
    : links;

  return (
    <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card)_80%,transparent)]">
      <div className="p-5 lg:p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[#042f2e] font-bold text-lg">
            W
          </div>
          <div>
            <p className="font-semibold text-lg leading-tight">Wendy Coach</p>
            <p className="text-xs text-[var(--muted)]">Your trading mentor</p>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {allLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[#152033]"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <SignOutButton />
      </div>
    </aside>
  );
}
