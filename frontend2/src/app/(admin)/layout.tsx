"use client";

import { useAuth } from "@/hook/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import AdminSidebar from "@/components/layout/adminSidebar";
import { Shield } from "lucide-react";

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) return <div className="p-8 text-center">Đang kiểm tra quyền admin...</div>;
  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
        <Shield className="size-10 text-primary" />
        <p className="text-lg font-semibold">Chức năng chỉ dành cho admin.</p>
        <p className="text-sm text-muted-foreground">Liên hệ quản trị viên để được cấp quyền.</p>
      </section>
    );
  }

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="w-16 flex-shrink-0" aria-hidden="true" />
      <main className="flex-1 min-h-screen pb-16 lg:pb-20">{children}</main>
    </div>
  );
}
