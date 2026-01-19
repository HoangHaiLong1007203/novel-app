"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Flag, Lock } from "lucide-react";

interface ChapterItemProps {
  chapter: {
    _id: string;
    chapterNumber: number;
    title: string;
    createdAt?: string;
    isLocked?: boolean;
  };
  isActive?: boolean;
  onReport?: (chapterId: string) => void;
}

interface NumberAvatarProps {
  number?: number | string | null;
  className?: string;
  isLocked?: boolean;
}

export function NumberAvatar({ number, className, isLocked }: NumberAvatarProps) {
  const numRef = useRef<HTMLSpanElement | null>(null);
  const [fontSize, setFontSize] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = numRef.current;
    if (!el) return;
    const parent = el.parentElement as HTMLElement | null;
    if (!parent) return;

    let size = 16;
    const minSize = 8;
    const padding = 8;
    const avail = parent.getBoundingClientRect().width - padding;

    el.style.fontSize = `${size}px`;
    let w = el.getBoundingClientRect().width;
    while (w > avail && size > minSize) {
      size -= 1;
      el.style.fontSize = `${size}px`;
      w = el.getBoundingClientRect().width;
    }

    setFontSize(size);
  }, [number]);

  // Wrap Avatar so lock badge can overlap the circular border
  return (
    <div className={"relative inline-block " + (className ? className : "") }>
      <Avatar className="w-8 h-8 bg-primary/20 text-primary text-base font-bold">
        <AvatarFallback>
          <span ref={numRef} style={fontSize ? { fontSize: `${fontSize}px` } : undefined}>{number}</span>
        </AvatarFallback>
      </Avatar>

      {isLocked && (
        <span className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 bg-background border rounded-full p-0.5">
          <Lock size={12} />
        </span>
      )}
    </div>
  );
}

export default function ChapterItem({ chapter, isActive, onReport }: ChapterItemProps) {
  const params = useParams();
  const novelId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const href = novelId ? `/novels/${novelId}/chapters/${chapter._id}` : `/#`;
  // NumberAvatar handles sizing and lock badge

  return (
    <Link href={href} className="block">
      <Card className="mb-2 py-0 bg-background/80 hover:shadow-md transition-shadow">
        <CardContent className={"flex gap-3 items-center py-2 px-2 " + (isActive ? "bg-primary/5" : "") }>
          <NumberAvatar number={chapter.chapterNumber} isLocked={chapter.isLocked} />
          <div className="flex-1 min-w-0">
            <div className={(isActive ? "font-bold text-primary" : "font-semibold") + " text-sm truncate"}>{chapter.title}</div>
            {chapter.createdAt && (
              <div className="text-xs opacity-60 mt-1">{new Date(chapter.createdAt).toLocaleString()}</div>
            )}
          </div>
          {onReport ? (
            <button
              type="button"
              className="text-red-400 hover:text-red-500"
              aria-label="Báo cáo chương"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onReport(chapter._id);
              }}
            >
              <Flag size={16} />
            </button>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
