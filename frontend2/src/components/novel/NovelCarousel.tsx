"use client";

import Link from "next/link";
import NovelCard from "@/components/novel/NovelCard";
import React from "react";

interface Novel {
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
}

interface Props {
  title: string;
  novels: Novel[];
  moreHref?: string;
  threshold?: number;
  ItemComponent?: React.ComponentType<{ novel: Novel }>;
  direction?: "horizontal" | "vertical";
}

export default function NovelCarousel({
  title,
  novels,
  moreHref,
  threshold = 4,
  ItemComponent = NovelCard,
  direction = "horizontal",
}: Props) {
  const isHorizontal = direction === "horizontal";
  const listClass = isHorizontal
    ? "flex gap-4 overflow-x-auto pb-3 scroll-smooth no-scrollbar"
    : "flex flex-col gap-4 overflow-y-auto max-h-[420px] pr-2";
  const itemClass = isHorizontal
    ? "group relative shrink-0 w-[150px] sm:w-[180px] transition-transform duration-300 hover:scale-[1.02]"
    : "group relative w-full transition-transform duration-300 hover:scale-[1.01]";
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="relative">
        <div className={listClass}>
          {novels.map((novel) => (
            <div key={novel._id} className={itemClass}>
              <div className="relative overflow-hidden rounded-md">
                <ItemComponent novel={novel} />
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {moreHref && novels.length > threshold && (
          <>
            {isHorizontal ? (
              <>
                <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white via-white/70 to-transparent" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                  <Link
                    href={moreHref}
                    className="bg-white/70 backdrop-blur-sm text-sm font-medium py-2 px-4 rounded-md hover:bg-primary hover:text-white active:scale-95 transition-transform duration-150"
                  >
                    Xem thêm →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="pointer-events-none absolute left-0 bottom-0 w-full h-16 bg-gradient-to-t from-white via-white/70 to-transparent" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-2 z-10">
                  <Link
                    href={moreHref}
                    className="bg-white/70 backdrop-blur-sm text-sm font-medium py-2 px-4 rounded-md hover:bg-primary hover:text-white active:scale-95 transition-transform duration-150"
                  >
                    Xem thêm →
                  </Link>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
