"use client";

import Link from "next/link";
import { Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator, 
  DropdownMenuLabel,
  Avatar, AvatarImage, AvatarFallback
 } from "@/components/ui";
import { useAuth } from "@/hook/useAuth";
import { logout } from "@/lib/api";
import Icon from "@/components/Icon";

export default function Navbar() {
  const { user, loading, setUser } = useAuth();

  return (
    <nav className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Icon name="book" size={20} />
          <span>Novel</span>
        </Link>

        {/* Menu bên phải */}
        <div className="flex items-center gap-2">
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                    <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.username}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
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
                  <DropdownMenuItem onClick={() => { setUser(null); logout(); }}>
                    <Icon name="logout" className="mr-2" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </>
            )

          )}
        </div>
      </div>
    </nav>
  );
}
