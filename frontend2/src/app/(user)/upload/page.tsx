// (user)/upload
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/lib/api";
import { useAuth } from "@/hook/useAuth";
import { Button } from "@/components/ui";
import NovelCard from "@/components/novel/NovelCard";
import NovelForm from "@/components/novel/NovelForm";
import Link from "next/link";

interface Novel {
  _id: string;
  title: string;
  author: string;
  poster: { username: string };
  coverImageUrl?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userNovels, setUserNovels] = useState<Novel[]>([]);

  // fetch user novels
  useEffect(() => {
    if (user?._id) {
      API.get(`/api/novels?poster=${user._id}`)
        .then((res) => setUserNovels(res.data?.novels || []))
        .catch(() => setUserNovels([]));
    }
  }, [user]);

  if (!loading && !user)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p>Bạn cần đăng nhập để đăng truyện.</p>
          <div className="flex justify-center gap-3 mt-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
              className="underline"
            >
              Đăng nhập
            </Link>
            <Link
              href={`/register?redirect=${encodeURIComponent(window.location.pathname)}`}
              className="underline"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* vùng truyện đã đăng */}
      <div>
        <p className="font-medium mb-2">
          Truyện đã đăng: <span>{userNovels.length}</span>
        </p>

        {userNovels.length > 0 && (
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-3 scroll-smooth no-scrollbar">
              {userNovels.map((novel) => (
                <div
                  key={novel._id}
                  className="shrink-0 w-[150px] sm:w-[180px] transition-transform duration-300 hover:scale-[1.02]"
                >
                  <NovelCard
                    novel={novel}
                    mode="edit"
                    onRead={(id) => router.push(`/novels/${id}`)}
                    onEdit={(id) => router.push(`/novels/update/${id}`)}
                  />
                </div>
              ))}
            </div>

            {/* ẩn thanh cuộn */}
            <style>{`
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* overlay mờ bên phải */}
            {userNovels.length > 4 && (
              <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white via-white/70 to-transparent" />
            )}

            {/* nút xem thêm */}
            {userNovels.length > 4 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/70 backdrop-blur-sm"
                  onClick={() => router.push("/me/novels")}
                >
                  Xem thêm →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* form tạo truyện */}
      <NovelForm
        user={user}
        onSuccess={(novelId) => router.push(`/novels/${novelId}`)}
      />
    </div>
  );
}
