"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui";
import { MessageCircle, Star, Eye } from "lucide-react";

interface NovelCardProps {
  novel: {
    _id: string;
    title: string;
    author?: string | { username: string };
    poster?: { username: string };
    coverImageUrl?: string;
    genres?: string[];
    status?: string;
    views?: number;
    commentsCount?: number;
    averageRating?: number;
  };
}

export default function NovelCard({ novel }: NovelCardProps) {
  const authorName =
    typeof novel.author === "string"
      ? novel.author
      : novel.author?.username || "Ẩn danh";

  const posterName = novel.poster?.username || "Không rõ";

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <Link href={`/novels/${novel._id}`}>
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={novel.coverImageUrl || process.env.NEXT_PUBLIC_DEFAULT_COVER ||"/default-cover.png"}
            alt={novel.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      <CardContent className="p-3 space-y-1">
        <Link
          href={`/novels/${novel._id}`}
          className="line-clamp-1 font-semibold hover:text-primary"
        >
          {novel.title}
        </Link>

        {/* hiển thị cả tác giả và người đăng */}
        <p className="text-sm text-muted-foreground line-clamp-1">
          Tác giả: {authorName}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-1">
          Người đăng: {posterName}
        </p>

        {novel.genres && novel.genres.length > 0 && (
          <p className="text-xs text-foreground/70 line-clamp-1">
            {novel.genres.join(", ")}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {novel.status || "Không rõ"}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between px-3 pb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Eye size={14} />
          {novel.views ?? 0}
        </div>
        <div className="flex items-center gap-2">
          <Star size={14} />
          {novel.averageRating?.toFixed(1) ?? 0}
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle size={14} />
          {novel.commentsCount ?? 0}
        </div>
      </CardFooter>
    </Card>
  );
}
