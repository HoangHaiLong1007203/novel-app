"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import { Card, CardContent, CardFooter, Badge, Button } from "@/components/ui";
import { MessageCircle, Star, Eye, User, UploadCloud } from "lucide-react";
import { getActiveGenreNames } from "@/lib/genreLookup";

interface NovelCardProps {
  novel: {
    _id: string;
    title: string;
    author?: string | { username?: string };
    poster?: { _id?: string; username?: string };
    coverImageUrl?: string;
    genres?: string[];
    status?: string;
    views?: number;
    commentsCount?: number;
    averageRating?: number;
  };
  mode?: "read" | "edit";
  onRead?: (novelId: string) => void;
  onEdit?: (novelId: string) => void;
}

export default function NovelCard({ novel, mode = "read", onRead, onEdit }: NovelCardProps) {
  const router = useRouter();
  const goToRead = () => {
    if (onRead) return onRead(novel._id);
    router.push(`/novels/${novel._id}`);
  };
  const goToEdit = () => {
    if (onEdit) return onEdit(novel._id);
    router.push(`/novels/update/${novel._id}`);
  };
  const handleCardClick = () => goToRead();
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const authorName =
      typeof novel.author === "string"
        ? novel.author
        : novel.author?.username || "an-danh";
    router.push(`/novels/by/author/${encodeURIComponent(authorName)}`);
  };
  const handleGenreClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const genre = novel.genres?.[0];
    if (!genre) return;
    const genreNames = await getActiveGenreNames();
    if (genreNames.includes(genre)) {
      const params = new URLSearchParams();
      params.set("genres", genre);
      params.set("page", "1");
      router.push(`/search?${params.toString()}`);
      return;
    }
    router.push("/search");
  };
  const handlePosterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const posterKey = novel.poster?._id ?? (novel.poster?.username || null);
    if (posterKey) router.push(`/novels/by/poster/${encodeURIComponent(String(posterKey))}`);
  };

  const authorName =
    typeof novel.author === "string"
      ? novel.author
      : novel.author?.username || "Ẩn danh";

  const posterName = novel.poster?.username || "Không rõ";

  return (
    <Card
      className="relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer py-0 min-w-[32.3vw] xs:min-w-[152px] sm:min-w-[137px] md:min-w-[152px] lg:min-w-[167px]"
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

      {mode === "edit" && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button
              variant="secondary"
              className="bg-white text-black hover:bg-primary hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                goToRead();
              }}
            >
              Đọc
            </Button>
            <Button
              variant="secondary"
              className="bg-white text-black hover:bg-primary hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                goToEdit();
              }}
            >
              Sửa
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
