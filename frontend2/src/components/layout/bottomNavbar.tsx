"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
// Removed unused Avatar and auth imports
import Icon from "@/components/Icon";

export default function BottomNavbar() {
  const pathname = usePathname();
  // Centralized patterns for pages where the bottom navbar should be hidden.
  // To add more pages in future, append either a string or a RegExp here.
  // - If a string ends with `/*` it is treated as a prefix match (startsWith).
  // - If a string has no wildcard it's treated as an exact path.
  // - You can also add RegExp entries for complex matches.
  const HIDE_ON_PATHS: Array<string | RegExp> = [
    /^\/novels\/[^/]+\/chapters\/[^/]+$/,
  ];

  const matchesPattern = (path: string | null | undefined, pattern: string | RegExp) => {
    if (!path) return false;
    if (pattern instanceof RegExp) return pattern.test(path);
    if (pattern.endsWith("/*")) return path.startsWith(pattern.slice(0, -1));
    return path === pattern;
  };

  const shouldHide = HIDE_ON_PATHS.some((p) => matchesPattern(pathname, p));
  if (shouldHide) return null;
  const navItems = [
    { href: "/bookshelf", icon: "book", label: "Tủ truyện" },
    { href: "/", icon: "home", label: "Khám phá" },
    { href: "/ranking", icon: "star", label: "Xếp hạng" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 border-t shadow-lg">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-2 py-1 text-xs font-medium transition-colors ${
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                ? "text-blue-600"
                : "text-muted-foreground hover:text-blue-600"
            }`}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
