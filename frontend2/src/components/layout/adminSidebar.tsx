"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  User,
  Coins,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname() || "";
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem("adminSidebarCollapsed");
      if (v !== null) setCollapsed(v === "true");
    } catch {
      // ignore (SSR or privacy)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("adminSidebarCollapsed", String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  const items = [
    { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> },
    { href: "/admin/novels", label: "Novel", icon: <FileText className="w-5 h-5 flex-shrink-0" /> },
    { href: "/admin/users", label: "User", icon: <User className="w-5 h-5 flex-shrink-0" /> },
    { href: "/admin/transactions", label: "Transaction", icon: <Coins className="w-5 h-5 flex-shrink-0" /> },
    { href: "/admin/reports", label: "Report", icon: <BarChart2 className="w-5 h-5 flex-shrink-0" /> },
  ];

  return (
    <nav
      className={`fixed left-0 top-0 h-full pt-16 p-4 overflow-auto bg-background z-40 transition-all duration-200 ease-in-out border-r shadow-lg ${
        collapsed ? "w-16" : "w-64"
      }`}
      aria-label="Admin sidebar"
    >
        <button
        type="button"
        aria-label={collapsed ? "Mở sidebar" : "Thu gọn sidebar"}
        onClick={() => setCollapsed((s) => !s)}
        className="absolute top-16 right-3 inline-flex items-center justify-center rounded p-1 hover:bg-accent/30"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      <ul className="flex flex-col gap-2 mt-6">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-md px-3 py-2 text-sm hover:bg-accent/60 ${
                  active ? "bg-accent/80 font-semibold" : ""
                }`}
                title={it.label}
              >
                {it.icon}
                <span className={`${collapsed ? "hidden" : ""}`}>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
