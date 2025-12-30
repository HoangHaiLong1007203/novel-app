"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui";
import { useAuth } from "@/hook/useAuth";
import Icon from "@/components/Icon";

export default function BottomNavbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const navItems = [
    { href: "/novels", icon: "book", label: "Truyện" },
    { href: "/ranking", icon: "star", label: "Xếp hạng" },
    { href: "/upload", icon: "plus", label: "Đăng" },
    { href: user ? "/profile" : "/login", icon: "user", label: user ? "Hồ sơ" : "Đăng nhập" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 border-t shadow-lg">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-2 py-1 text-xs font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? "text-blue-600"
                : "text-muted-foreground hover:text-blue-600"
            }`}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
        {user && (
          <Avatar className="h-7 w-7 ml-2">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
            <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </nav>
  );
}
