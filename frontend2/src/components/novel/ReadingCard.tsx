"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import React, { useEffect, useState } from "react";
import { API } from "@/lib/api";
import Icon from "@/components/Icon";
import { useRouter } from "next/navigation";

interface NovelSummary {
  _id?: string;
  title?: string;
  description?: string;
  coverImage?: string;
  coverImageUrl?: string;
}

interface ReadingProgress {
  novel?: NovelSummary | null;
  completionPercentage?: number;
  lastReadAt?: string | null;
  totalChaptersRead?: number;
  readChapters?: string[];
}

interface Props {
  progress: ReadingProgress;
  onRemoved?: (novelId: string) => void;
}

export default function ReadingCard({ progress, onRemoved }: Props) {
  const novel = progress.novel! as NovelSummary;
  const [deleting, setDeleting] = useState(false);
  const [totalChapters, setTotalChapters] = useState<number | null>(null);
  const [firstChapterId, setFirstChapterId] = useState<string | null>(null);
  const [lastReadChapterId, setLastReadChapterId] = useState<string | null>(null);
  const [validReadCount, setValidReadCount] = useState<number | null>(null);
  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(false);
  const router = useRouter();

  // Determine the displayed progress based on position of last-read chapter
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);

  const rawReadCount = progress.totalChaptersRead ?? progress.readChapters?.length ?? 0;
  const readCount = validReadCount ?? rawReadCount;

  const handleDelete = async () => {
    if (!novel._id) return;
    try {
      setDeleting(true);
      await API.delete(`/api/reading-progress/${novel._id}`);
      onRemoved?.(novel._id);
    } catch (e) {
      console.error("Không thể xóa khỏi tủ truyện:", e);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      if (!novel._id) return;
      try {
        const res = await API.get(`/api/novels/${novel._id}/chapters?sort=asc`);
        if (!mounted) return;
        const fetchedChapters = res.data?.chapters || [];
        const normalized: Array<{ _id?: string; id?: string }> = Array.isArray(fetchedChapters) ? fetchedChapters : [];
        setTotalChapters(normalized.length);
        const firstId = normalized.length ? (normalized[0]._id || normalized[0].id || null) : null;
        setFirstChapterId(firstId ? String(firstId) : null);
        const existingIdSet = new Set(normalized.map((c) => (c._id || c.id)?.toString()).filter(Boolean) as string[]);

        // Fetch detailed reading progress for this novel to determine last-read chapter
        try {
          const progRes = await API.get(`/api/reading-progress/${novel._id}`);
          if (!mounted) return;
          const rp = progRes.data?.readingProgress;
          setNotifyEnabled(!!rp?.notifyOnNewChapter);

          const readIdSet = new Set<string>();
          const readChapters = Array.isArray(rp?.readChapters) ? rp.readChapters : [];
          for (const item of readChapters) {
            const id = (item as { _id?: string })?._id || item;
            const idStr = id?.toString();
            if (idStr) readIdSet.add(idStr);
          }
          if (Array.isArray(progress.readChapters)) {
            for (const item of progress.readChapters) {
              const idStr = item?.toString();
              if (idStr) readIdSet.add(idStr);
            }
          }

          const validReadIds = new Set<string>();
          for (const id of readIdSet) {
            if (existingIdSet.has(id)) validReadIds.add(id);
          }
          setValidReadCount(validReadIds.size);

          let lastValidId: string | null = null;
          for (let i = normalized.length - 1; i >= 0; i -= 1) {
            const chapterId = (normalized[i]._id || normalized[i].id)?.toString();
            if (chapterId && validReadIds.has(chapterId)) {
              lastValidId = chapterId;
              break;
            }
          }

          if (lastValidId) {
            const idx = normalized.findIndex((c) => (c._id || c.id)?.toString() === lastValidId);
            if (idx >= 0) {
              setLastReadChapterId(lastValidId);
              setDisplayIndex(idx + 1);
            } else {
              setLastReadChapterId(null);
              setDisplayIndex(null);
            }
          } else {
            setLastReadChapterId(null);
            setDisplayIndex(null);
          }
        } catch {
          // ignore, no auth or no progress
        }
      } catch {
        if (!mounted) return;
        setTotalChapters(null);
      }
    };
    fetchCount();
    return () => { mounted = false };
  }, [novel._id, progress.readChapters]);

  return (
    <Sheet>
      <Card onClick={() => novel._id && router.push(`/novels/${novel._id}`)} className="relative !flex-row items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition">
        <div className="relative w-14 aspect-[3/4] overflow-hidden rounded-md bg-muted flex-shrink-0">
          <Image
            src={novel.coverImageUrl || novel.coverImage || process.env.NEXT_PUBLIC_DEFAULT_COVER || "/default-cover.jpg"}
            alt={novel.title || "Bìa truyện"}
            fill
            sizes="56px"
            className="object-cover transition-transform duration-300"
          />
        </div>

        <div className="flex-1 pl-2">
          <p className="font-medium line-clamp-1">{novel.title}</p>
          <p className="text-sm text-muted-foreground">
            {displayIndex != null ? (
              <>Đã đọc {displayIndex}/{totalChapters ?? "?"} chương</>
            ) : (
              <>Đã đọc {totalChapters ? Math.min(readCount, totalChapters) : readCount}{totalChapters ? `/${totalChapters} chương` : " chương"}</>
            )}
          </p>
        </div>

        <button
          onClick={async (e) => {
            e.stopPropagation();
            const newVal = !notifyEnabled;
            // Optimistic UI
            setNotifyEnabled(newVal);
            try {
              if (!novel._id) return;
              await API.put(`/api/reading-progress/${novel._id}`, { notifyOnNewChapter: newVal });
            } catch (err) {
              // revert on error (e.g., not authenticated)
              setNotifyEnabled((prev) => !prev);
              console.error('Không thể cập nhật thông báo:', err);
            }
          }}
          title={notifyEnabled ? "Tắt thông báo" : "Bật thông báo"}
          className="p-2 rounded hover:bg-muted"
          aria-label="Thông báo"
        >
          <Icon name={notifyEnabled ? "bell" : "bellOff"} size={18} />
        </button>

        <SheetTrigger asChild>
          <button onClick={(e) => e.stopPropagation()} className="p-2 rounded hover:bg-muted">
            <span className="text-xl">⋮</span>
          </button>
        </SheetTrigger>
      </Card>

      <SheetContent className="px-4 pb-6" side="bottom">
        <SheetHeader>
          <SheetTitle className="sr-only">Tùy chọn truyện: {novel.title}</SheetTitle>
        </SheetHeader>
        <div className="flex gap-4 items-start mt-4">
          <div className="relative w-18 aspect-[3/4] overflow-hidden rounded-md bg-muted">
            <Image
              src={novel.coverImageUrl || novel.coverImage || process.env.NEXT_PUBLIC_DEFAULT_COVER || "/default-cover.jpg"}
              alt={novel.title || "Bìa truyện"}
              fill
              sizes="72px"
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold">{novel.title}</h3>
            <p className="text-sm text-muted-foreground">
              {displayIndex != null ? (
                <>Đã đọc {displayIndex}/{totalChapters ?? "?"} chương</>
              ) : (
                <>Đã đọc {totalChapters ? Math.min(readCount, totalChapters) : readCount}{totalChapters ? `/${totalChapters} chương` : " chương"}</>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {/* If we know the last read chapter, go directly to it */}
          <Link
            href={lastReadChapterId || firstChapterId ? `/novels/${novel._id}/chapters/${lastReadChapterId || firstChapterId}` : `/novels/${novel._id}`}
            className="block text-center py-3 rounded-lg bg-primary text-white"
          >
            Đọc tiếp
          </Link>

          <button className="w-full py-3 rounded-lg border">Tải truyện</button>

          <button onClick={handleDelete} disabled={deleting} className="w-full py-3 rounded-lg border text-red-500">
            {deleting ? "Đang xóa..." : "Xóa khỏi Tủ Truyện"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
