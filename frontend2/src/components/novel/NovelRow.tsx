"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface NovelRowProps {
  novel: {
    _id: string;
    title: string;
    author?: string;
    description?: string;
    genres?: string[];
    coverImageUrl?: string;
  };
}

export default function NovelRow({ novel }: NovelRowProps) {
  const router = useRouter();
  // Ngăn click lan ra ngoài khi click vào tác giả hoặc thể loại
  const handleRowClick = () => {
    router.push(`/novels/${novel._id}`);
  };
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/author/${encodeURIComponent(novel.author || "an-danh")}`);
  };
  const handleGenreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (novel.genres?.[0]) {
      router.push(`/genre/${encodeURIComponent(novel.genres[0])}`);
    }
  };
  return (
    <Card
      className="!flex-row flex items-start gap-4 p-3 hover:shadow-md transition-shadow cursor-pointer w-full max-w-4xl min-w-[25rem] mx-auto"
      onClick={handleRowClick}
      tabIndex={0}
      role="button"
    >
      <div className="relative flex-shrink-0 w-20 h-28 overflow-hidden rounded-md">
        <Image
          src={novel.coverImageUrl || "/default-cover.jpg"}
          alt={novel.title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <Link
            href={`/novels/${novel._id}`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="font-semibold hover:text-primary line-clamp-1"
          >
            {novel.title}
          </Link>
          {novel.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {novel.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User size={14} />
            <span
              className="hover:text-primary cursor-pointer"
              onClick={handleAuthorClick}
            >
              {novel.author || "Ẩn danh"}
            </span>
          </div>

          {novel.genres?.[0] && (
            <Badge
              variant="outline"
              className="text-xs hover:text-primary cursor-pointer"
              onClick={handleGenreClick}
            >
              {novel.genres[0]}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
