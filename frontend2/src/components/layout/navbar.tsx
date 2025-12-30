"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui";
import { useAuth } from "@/hook/useAuth";
import { logout } from "@/lib/api";
import Icon from "@/components/Icon";
import SearchSuggestBar from "@/components/ui/SearchSuggestBar"; // ✅ dùng component tìm kiếm gợi ý thật

export default function Navbar() {
  const { user, loading, setUser } = useAuth();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false); // ✅ toggle thanh tìm kiếm
  const [closing, setClosing] = useState(false); // ✅ for exit animation
  const [entered, setEntered] = useState(false); // ✅ for enter animation

  useEffect(() => {
    if (showSearch && !closing) {
      requestAnimationFrame(() => setEntered(true));
    }
  }, [showSearch, closing]);

  return (
    <nav className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 relative">
        {/* Nút tìm kiếm bên trái */}
        <div className="flex items-center">
          {!showSearch ? (
            <button
              onClick={() => {
                setShowSearch(true);
                setClosing(false);
                setEntered(false);
              }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted"
            >
              <Icon name="search" size={20} />
              <span className="hidden sm:inline text-sm">Tìm kiếm</span>
            </button>
          ) : (
            <div className={`transition-all duration-500 ease-out ${closing ? 'opacity-0 translate-x-4' : entered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
              <SearchSuggestBar
                placeholder="Tìm truyện..."
                size="md"
                className="w-64 sm:w-80"
                showCloseButton={true}
                onClose={() => {
                  setClosing(true);
                  setTimeout(() => setShowSearch(false), 500);
                }}
                onSelect={() => {
                  setClosing(true);
                  setTimeout(() => setShowSearch(false), 500);
                }}
              />
            </div>
          )}
        </div>

        {/* Logo giữa */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Link href="/novels" className="flex items-center gap-2 font-semibold">
            <Image
              src="/assets/logo/logo-light.png"
              alt="Logo"
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
            <span className="text-lg">Novel</span>
          </Link>
        </div>

        {/* Menu bên phải */}
        <div className="flex items-center gap-2 ml-auto">
          {!loading &&
            (user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage
                      src={user.avatarUrl || undefined}
                      alt={user.username}
                    />
                    <AvatarFallback>
                      {user.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Icon name="user" className="mr-2" /> Hồ sơ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/upload">
                      <Icon name="plus" className="mr-2" /> Đăng truyện
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setUser(null);
                      logout();
                      if (
                        ["/upload", "/profile", "/me"].some((p) =>
                          pathname.startsWith(p)
                        )
                      )
                        window.location.href = "/";
                    }}
                  >
                    <Icon name="logout" className="mr-2" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                    Đăng nhập
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    href={`/register?redirect=${encodeURIComponent(pathname)}`}
                  >
                    Đăng ký
                  </Link>
                </Button>
              </>
            ))}
        </div>
      </div>
    </nav>
  );
}
