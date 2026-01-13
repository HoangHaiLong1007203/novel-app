"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hook/useAuth";
import { getUserBookmarks, getUserReadingProgress } from "@/lib/api";
import ReadingCard from "@/components/novel/ReadingCard";
import NovelRow from "@/components/novel/NovelRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface BookmarkItem {
  _id?: string;
  novel?: NovelSummary | null;
}

type BookmarkNovel = NovelSummary & { _id: string; title: string };

export default function BookshelfPage() {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<ReadingProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "bookmark">("history");

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await getUserReadingProgress(1, 50);
      setHistory((data && data.readingProgress) || []);
    } catch (err) {
      console.error("Không thể tải lịch sử đọc:", err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const fetchBookmarks = useCallback(async () => {
    setLoadingBookmarks(true);
    try {
      const data = await getUserBookmarks(1, 50);
      setBookmarks((data && data.bookmarks) || []);
    } catch (err) {
      console.error("Không thể tải danh sách đánh dấu:", err);
      setBookmarks([]);
    } finally {
      setLoadingBookmarks(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      fetchHistory();
      fetchBookmarks();
    } else if (!loading && !user) {
      setHistory([]);
      setBookmarks([]);
      setLoadingHistory(false);
      setLoadingBookmarks(false);
    }
  }, [user, loading, fetchHistory, fetchBookmarks]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <h1 className="text-xl font-semibold">Tủ truyện của tôi</h1>
        <p className="text-muted-foreground">Bạn cần đăng nhập để xem tủ truyện.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">Tủ truyện của tôi</h1>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "history" | "bookmark")}>
        <TabsList className="mb-4">
          <TabsTrigger value="history" className="flex-1">Lịch sử</TabsTrigger>
          <TabsTrigger value="bookmark" className="flex-1">Đánh dấu</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          {loadingHistory ? (
            <div className="p-8 text-center">Đang tải lịch sử đọc...</div>
          ) : history.length === 0 ? (
            <p className="text-muted-foreground">Chưa có tiến trình đọc nào được lưu.</p>
          ) : (
            <div className="space-y-4">
              {history.map((progress: ReadingProgress) => (
                <ReadingCard
                  key={progress.novel?._id || progress._id}
                  progress={progress}
                  onRemoved={() => fetchHistory()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmark">
          {loadingBookmarks ? (
            <div className="p-8 text-center">Đang tải danh sách đánh dấu...</div>
          ) : bookmarks.length === 0 ? (
            <p className="text-muted-foreground">Bạn chưa đánh dấu truyện nào.</p>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => {
                if (!bookmark.novel || !bookmark.novel._id) return null;
                const novelData: BookmarkNovel = {
                  ...bookmark.novel,
                  _id: bookmark.novel._id,
                  title: bookmark.novel.title ?? "Truyện chưa có tên",
                };
                return <NovelRow key={bookmark._id || novelData._id} novel={novelData} />;
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
