// (user)/me/novels (wrapper) — keep auth check, reuse NovelsListPage
"use client";

import Link from "next/link";
import { useAuth } from "@/hook/useAuth";
import NovelsListPage from "@/components/novel/NovelsListPage";

export default function MyNovelsPage() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p>Bạn cần đăng nhập để xem truyện đã đăng.</p>
          <div className="flex justify-center gap-3 mt-3">
            <Link href="/login" className="underline">Đăng nhập</Link>
            <Link href="/register" className="underline">Đăng ký</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <NovelsListPage
      initialFetchParams={{ poster: user._id }}
      editable={true}
      title={`Truyện đã đăng bởi ${user?.username || 'bạn'}`}
      showFilter={true}
    />
  );
}
