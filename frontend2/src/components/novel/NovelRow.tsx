"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { User } from "lucide-react";

interface NovelRowProps {
  novel: {
    _id: string;
    title: string;
    author?: { username: string };
    description?: string;
    genres?: string[];
    coverImageUrl?: string;
  };
}

export default function NovelRow({ novel }: NovelRowProps) {
  return (
    <Card className="flex items-start gap-4 p-3 hover:shadow-md transition-shadow">
      <Link
        href={`/novels/${novel._id}`}
        className="relative flex-shrink-0 w-20 h-28 overflow-hidden rounded-md"
      >
        <Image
          src={novel.coverImageUrl || "/default-cover.jpg"}
          alt={novel.title}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </Link>

      <div className="flex flex-col justify-between flex-1">
        <div>
          <Link
            href={`/novels/${novel._id}`}
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
            <span>{novel.author?.username || "Ẩn danh"}</span>
          </div>

          {novel.genres?.[0] && (
            <Badge variant="outline" className="text-xs">
              {novel.genres[0]}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
