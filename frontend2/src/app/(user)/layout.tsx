"use client";

import { useAuth } from "@/hook/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function UserProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // encodeURIComponent để tránh lỗi khi path có query
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) return <div className="p-8 text-center">Đang kiểm tra đăng nhập...</div>;

  if (!user) return null;

  return <>{children}</>;
}
