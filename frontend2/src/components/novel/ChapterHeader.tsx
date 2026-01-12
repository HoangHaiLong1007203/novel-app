"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  List,
  Bookmark,
} from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import ChapterList from "./ChapterList";
import { ReaderSettingsPayload } from "@/lib/api";

interface ChapterHeaderProps {
  novelTitle: string;
  author: string;
  chapterTitle: string;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  showSettings?: boolean;
  onToggleSettings?: () => void;
  readerSettings?: ReaderSettingsPayload;
  chapters?: { _id: string; chapterNumber?: number; title?: string; createdAt?: string; isLocked?: boolean }[];
  novelId?: string;
}

export default function ChapterHeader({
  novelTitle,
  author,
  chapterTitle,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
  showSettings = false,
  onToggleSettings,
  readerSettings,
  chapters,
  novelId,
}: ChapterHeaderProps) {
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <div
      className="w-full px-4 py-5"
      style={{
        backgroundColor: readerSettings?.backgroundColor || "#f5efe4",
        fontFamily: readerSettings?.fontFamily
          ? ( // match the same mapping used in ChapterReader
              {
                "Literata": "var(--font-literata)",
                "Space Grotesk": "var(--font-space-grotesk)",
                "Be Vietnam Pro": "var(--font-be-vietnam-pro)",
                "Merriweather": "var(--font-merriweather)",
                "system": "system-ui, sans-serif",
              }[readerSettings.fontFamily] || readerSettings.fontFamily
            ) + ", Be Vietnam Pro, sans-serif"
          : undefined,
        fontSize: readerSettings?.fontSize ? `${readerSettings.fontSize}px` : undefined,
        lineHeight: readerSettings?.lineHeight ?? undefined,
      }}
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {/* Tên truyện */}
        <div className="text-center">
          {novelId ? (
            <Link href={`/novels/${novelId}`} className="group no-underline">
              <h1 className="text-lg font-semibold text-foreground group-hover:underline group-hover:text-primary cursor-pointer">
                {novelTitle}
              </h1>
            </Link>
          ) : (
            <h1 className="text-lg font-semibold text-foreground">{novelTitle}</h1>
          )}
          <p className="text-sm text-muted-foreground">{author}</p>
        </div>

        {/* Điều hướng chương */}
        <div className="flex items-center justify-between">
          {/* Chương trước */}
          <Button variant="outline" size="icon" className="rounded-full" onClick={onPrev} disabled={!hasPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <p className="text-sm text-center font-medium">{chapterTitle}</p>

          {/* Chương sau */}
          <Button variant="outline" size="icon" className="rounded-full" onClick={onNext} disabled={!hasNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Nhóm nút chức năng */}
        <div className="flex justify-center gap-3">
          <Button variant={showSettings ? "default" : "outline"} className="gap-2" onClick={onToggleSettings}>
            <Settings className="h-4 w-4" />
            Cấu hình
          </Button>

          <Dialog open={tocOpen} onOpenChange={(v) => setTocOpen(v)}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <List className="h-4 w-4" />
                Mục lục
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <ChapterList chapters={chapters || []} mode="read" novelId={novelId} />
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Đánh dấu
          </Button>
        </div>
      </div>
    </div>
  );
}
