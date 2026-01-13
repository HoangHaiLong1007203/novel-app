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
  const [chapters, setChapters] = useState<Array<{ _id: string }>>([]);
  const [lastReadChapterId, setLastReadChapterId] = useState<string | null>(null);
  const router = useRouter();

  // Determine the displayed progress based on position of last-read chapter
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);

  const readCount = progress.totalChaptersRead ?? progress.readChapters?.length ?? 0;

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
        setChapters(Array.isArray(fetchedChapters) ? fetchedChapters : []);
        setTotalChapters(Array.isArray(fetchedChapters) ? fetchedChapters.length : 0);

        // Fetch detailed reading progress for this novel to determine last-read chapter
        try {
          const progRes = await API.get(`/api/reading-progress/${novel._id}`);
          if (!mounted) return;
          const rp = progRes.data?.readingProgress;
          // Prefer last reading session chapter if available
          const sessionLast = rp?.readingSessions?.length ? rp.readingSessions[rp.readingSessions.length - 1]?.chapter : null;
          const readChLast = rp?.readChapters?.length ? (rp.readChapters[rp.readChapters.length - 1]._id || rp.readChapters[rp.readChapters.length - 1]) : null;
          const lastId = sessionLast?.toString() || readChLast?.toString() || (progress.readChapters?.length ? (progress.readChapters[progress.readChapters.length - 1] as any)?.toString?.() : null);
          setLastReadChapterId(lastId || null);
          if (lastId) {
            const idx = (Array.isArray(fetchedChapters) ? fetchedChapters.findIndex((c: any) => (c._id || c.id) === lastId) : -1);
            if (idx >= 0) setDisplayIndex(idx + 1);
            else setDisplayIndex(null);
          } else {
            setDisplayIndex(null);
          }
        } catch (e) {
          // ignore, no auth or no progress
        }
      } catch {
        if (!mounted) return;
        setTotalChapters(null);
      }
    };
    fetchCount();
    return () => { mounted = false };
  }, [novel._id]);

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
              <>Đã đọc {readCount}{totalChapters ? `/${totalChapters} chương` : " chương"}</>
            )}
          </p>
        </div>

        <button
          onClick={(e) => e.stopPropagation()}
          title="Thông báo chương mới"
          className="p-2 rounded hover:bg-muted"
          aria-label="Thông báo"
        >
          <Icon name="bell" size={18} />
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
                <>Đã đọc {readCount}{totalChapters ? `/${totalChapters} chương` : " chương"}</>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {/* If we know the last read chapter, go directly to it */}
          <Link href={lastReadChapterId ? `/novels/${novel._id}/chapters/${lastReadChapterId}` : `/novels/${novel._id}`} className="block text-center py-3 rounded-lg bg-primary text-white">
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
