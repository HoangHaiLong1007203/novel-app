"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hook/useAuth";
import Icon from "@/components/Icon";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils"; // nếu chưa có file utils, có thể tạm xoá dòng này

export default function Navbar() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo + tên */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image
            src="/assets/logo/logo-light.png"
            alt="Novel App"
            width={26}
            height={26}
            className="dark:hidden"
          />
          <Image
            src="/assets/logo/logo-dark.png"
            alt="Novel App"
            width={26}
            height={26}
            className="hidden dark:block"
          />
          <span className="text-base">Novel App</span>
        </Link>

        {/* Phần bên phải */}
        <nav className="flex items-center gap-3">
          {loading ? (
            // Khi đang load user
            <>
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </>
          ) : user ? (
            // ✅ Nếu đã đăng nhập
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.username}
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <Icon name="user" size={20} />
                  )}
                  <span className="hidden sm:inline text-sm font-medium">
                    {user.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <Icon name="user" size={16} /> Hồ sơ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/library" className="flex items-center gap-2">
                    <Icon name="bookmark" size={16} /> Tủ truyện
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/logout" className="flex items-center gap-2 text-destructive">
                    <Icon name="logout" size={16} /> Đăng xuất
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // ✅ Nếu chưa đăng nhập
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Icon name="login" size={18} /> Đăng nhập
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="flex items-center gap-1">
                  <Icon name="user" size={18} /> Đăng ký
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
