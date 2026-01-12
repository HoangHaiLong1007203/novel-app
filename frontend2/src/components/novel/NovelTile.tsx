"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

interface Novel {
  _id: string;
  title: string;
  author?: string | { username?: string };
  poster?: { _id?: string; username?: string };
  coverImageUrl?: string;
}

export default function NovelTile({ novel }: { novel: Novel }) {
  const router = useRouter();

  const handleClick = () => router.push(`/novels/${novel._id}`);
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = typeof novel.author === "string" ? novel.author : novel.author?.username || "an-danh";
    router.push(`/author/${encodeURIComponent(name)}`);
  };
  const handlePosterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const posterId = novel.poster?._id || novel.poster?.username || null;
    if (posterId) router.push(`/user/${encodeURIComponent(String(posterId))}`);
  };

  const authorName = typeof novel.author === "string" ? novel.author : novel.author?.username || "Ẩn danh";
  const posterName = novel.poster?.username || "Không rõ";

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className="cursor-pointer w-full max-w-[180px] group scale-75 origin-top-left"
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden rounded-md bg-muted">
        <Image
          src={novel.coverImageUrl || process.env.NEXT_PUBLIC_DEFAULT_COVER || "/default-cover.png"}
          alt={novel.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-2">
        <div className="font-semibold text-sm line-clamp-2">{novel.title}</div>
        <div className="text-xs text-muted-foreground mt-1 truncate" onClick={handleAuthorClick}>
          {authorName}
        </div>
        <div className="text-xs text-muted-foreground truncate" onClick={handlePosterClick}>
          {posterName}
        </div>
      </div>
    </div>
  );
}
