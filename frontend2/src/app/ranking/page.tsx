"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  ScrollArea
} from "@/components/ui";
import NovelRow from "@/components/novel/NovelRow";


const RANK_TYPES = [
  { key: "views_desc", label: "Lượt đọc" },
  { key: "comments_desc", label: "Bình luận" },
  { key: "reviews_desc", label: "Đánh giá" },
];

interface Novel {
  _id: string;
  title: string;
  author: string;
  views?: number;
  commentsCount?: number;
  averageRating?: number;
}



function RankingList({ novels }: { novels: Novel[] }) {
  return (
    <div className="flex flex-col gap-3">
      {novels.map((novel, idx) => (
        <div key={novel._id} className="flex items-center gap-3">
          <span className="w-8 text-lg font-bold text-primary flex-shrink-0 flex items-center justify-center">{idx + 1}</span>
          <div className="flex-1">
            <NovelRow novel={novel} />
          </div>
        </div>
      ))}
    </div>
  );
}


export default function RankingPage() {
  const [rankType, setRankType] = useState(RANK_TYPES[0].key);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNovels([]);
    setPage(1);
    setHasMore(true);
  }, [rankType]);

  useEffect(() => {
    if (!hasMore || loading) return;
    setLoading(true);
    API
      .get("/api/novels", {
        params: {
          sortBy: rankType,
          page,
          limit: 20,
        },
      })
      .then((res: { data: { novels: Novel[]; pagination?: { totalPages: number } } }) => {
        setNovels((prev: Novel[]) => {
          // Debug log
          console.log('Fetched novels:', res.data.novels);
          const map = new Map<string, Novel>();
          for (const n of [...prev, ...res.data.novels]) {
            if (!map.has(n._id)) map.set(n._id, n);
          }
          const merged = Array.from(map.values());
          console.log('Merged novels:', merged);
          return merged;
        });
        setHasMore(
          res.data.pagination !== undefined &&
            page < res.data.pagination.totalPages
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [rankType, page]);

  // Lazy load on scroll
  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 200 &&
        hasMore &&
        !loading
      ) {
        setPage((p) => p + 1);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore, loading]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-2 pb-20">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Bảng xếp hạng truyện</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <Select value={rankType} onValueChange={setRankType} disabled={loading}>
              <SelectTrigger className="w-48">
                {RANK_TYPES.find((t) => t.key === rankType)?.label}
              </SelectTrigger>
              <SelectContent>
                {RANK_TYPES.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="rounded border bg-background">
            <RankingList novels={novels} />
            {loading && <div className="p-4 text-center text-muted-foreground">Đang tải...</div>}
            {!hasMore && novels.length > 0 && (
              <div className="p-4 text-center text-green-600">Đã tải hết truyện!</div>
            )}
            {!loading && novels.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">Không có truyện nào.</div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
