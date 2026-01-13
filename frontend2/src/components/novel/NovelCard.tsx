"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import { Card, CardContent, CardFooter, Badge } from "@/components/ui";
import { MessageCircle, Star, Eye, User, UploadCloud } from "lucide-react";

interface NovelCardProps {
  novel: {
    _id: string;
    title: string;
    author?: string | { username?: string };
    poster?: { username?: string };
    coverImageUrl?: string;
    genres?: string[];
    status?: string;
    views?: number;
    commentsCount?: number;
    averageRating?: number;
  };
}

export default function NovelCard({ novel }: NovelCardProps) {
  const router = useRouter();
  const handleCardClick = () => router.push(`/novels/${novel._id}`);
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/author/${encodeURIComponent(
      typeof novel.author === "string" ? novel.author : novel.author?.username || "an-danh"
    )}`);
  };
  const handleGenreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (novel.genres?.[0]) {
      router.push(`/genre/${encodeURIComponent(novel.genres[0])}`);
    }
  };
  const handlePosterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const poster = novel.poster?.username || null;
    if (poster) router.push(`/user/${encodeURIComponent(poster)}`);
  };

  const authorName =
    typeof novel.author === "string"
      ? novel.author
      : novel.author?.username || "Ẩn danh";

  const posterName = novel.poster?.username || "Không rõ";

  return (
    <Card
      className="overflow-hidden group hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-muted">
        <Image
          src={novel.coverImageUrl || process.env.NEXT_PUBLIC_DEFAULT_COVER || "/default-cover.png"}
          alt={novel.title}
          fill
          sizes="280px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <CardContent className="p-3 space-y-1">
        <Link
          href={`/novels/${novel._id}`}
          onClick={(e) => e.stopPropagation()}
          className="line-clamp-2 text-xs font-semibold hover:text-primary block leading-tight min-h-[2rem]"
          style={{ WebkitBoxOrient: 'vertical' }}
        >
          {novel.title}
        </Link>

        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
          <User size={14} />
          <span
            className="hover:text-primary cursor-pointer line-clamp-1 min-w-0"
            onClick={handleAuthorClick}
          >
            {authorName}
          </span>
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-2 min-w-0">
          <UploadCloud size={16} className="text-muted-foreground" />
          <span
            className="hover:text-primary cursor-pointer line-clamp-1 min-w-0"
            onClick={handlePosterClick}
          >
            {posterName}
          </span>
        </div>

        {novel.genres && novel.genres.length > 0 && (
          <Badge
            variant="outline"
            className="text-xs hover:text-primary cursor-pointer"
            onClick={handleGenreClick}
          >
            {novel.genres[0]}
          </Badge>
        )}

        <p className="text-xs text-muted-foreground">{novel.status || "Không rõ"}</p>
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
