"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hook/useAuth";
import { getUserReadingProgress } from "@/lib/api";
import ReadingCard from "@/components/novel/ReadingCard";

interface NovelSummary {
  _id?: string;
  title?: string;
  description?: string;
  coverImage?: string;
  coverImageUrl?: string;
}

interface ReadingProgress {
  _id?: string;
  novel?: NovelSummary | null;
  readChapters?: string[];
  totalChaptersRead?: number;
  completionPercentage?: number;
  lastReadAt?: string | null;
}

export default function BookshelfPage() {
  const { user, loading } = useAuth();
  const [list, setList] = useState<ReadingProgress[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      setLoadingData(true);
      getUserReadingProgress(1, 50)
        .then((data) => {
          // backend returns { readingProgress: [...], pagination }
          setList((data && data.readingProgress) || []);
        })
        .catch(() => setList([]))
        .finally(() => setLoadingData(false));
    }
  }, [user, loading]);

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">Tủ truyện của tôi</h1>

      {loadingData ? (
        <div className="p-8 text-center">Đang tải tủ truyện...</div>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">Bạn chưa có truyện nào trong tủ đọc.</p>
      ) : (
        <div className="space-y-4">
          {list.map((p: ReadingProgress) => (
            <ReadingCard key={p.novel?._id || p._id} progress={p} />
          ))}
        </div>
      )}
    </div>
  );
}
