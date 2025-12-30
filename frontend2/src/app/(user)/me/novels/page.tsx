// (user)/me/novels
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { API } from "@/lib/api";
import { useAuth } from "@/hook/useAuth";
import NovelCard from "@/components/novel/NovelCard";
import NovelFilter from "@/components/novel/NovelFilter";
import {
  Button,
  ToggleGroup,
  ToggleGroupItem,
  Card,
} from "@/components/ui";
import PaginationCompact from "@/components/ui/PaginationCompact"
interface Novel {
  _id: string;
  title: string;
  author: string;
  poster: { username: string };
  coverImageUrl?: string;
  genres?: string[];
}

interface FilterState {
  categories: string[];
  genres: string[];
  status: string[];
  chapterRange: [number, number];
  sortBy: string | null;
}

export default function MyNovelsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "row">("card");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    genres: [],
    status: [],
    chapterRange: [0, 2100],
    sortBy: null,
  });
  const [showFilter, setShowFilter] = useState(false);
  const [isWide, setIsWide] = useState(false);

  const fetchNovels = useCallback(async () => {
    if (!user?._id) return;

    const params = new URLSearchParams({
      poster: user._id,
      page: page.toString(),
      limit: viewMode === "card" ? "20" : "10",
    });

    if (filters.categories.length) params.append("type", filters.categories.join(","));
    if (filters.genres.length) params.append("genres", filters.genres.join(","));
    if (filters.status.length) params.append("status", filters.status.join(","));
    if (filters.chapterRange[0] > 0)
      params.append("chapterMin", filters.chapterRange[0].toString());

    if (filters.chapterRange[1] < 2100) {
      params.append("chapterMax", filters.chapterRange[1].toString());
    }

    if (filters.sortBy) params.append("sortBy", filters.sortBy);

    try {
      const res = await API.get(`/api/novels?${params.toString()}`);
      const data = res.data;
      setNovels(data?.novels || []);
      setTotal(data?.pagination?.total ?? data?.novels?.length ?? 0);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch {
      setNovels([]);
      setTotal(0);
      setTotalPages(1);
    }
  }, [user?._id, page, viewMode, filters]);

  useEffect(() => {
    if (!loading && user?._id) fetchNovels();
  }, [loading, user?._id, page, viewMode, filters, fetchNovels]);

  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth >= 1536);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleRead = (id: string) => router.push(`/novels/${id}`);
  const handleEdit = (id: string) => router.push(`/novels/update/${id}`);

  if (!loading && !user)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p>Bạn cần đăng nhập để xem truyện đã đăng.</p>
          <div className="flex justify-center gap-3 mt-3">
            <Link href="/login" className="underline">
              Đăng nhập
            </Link>
            <Link href="/register" className="underline">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col xl:flex-row gap-6">
      {/* FILTER */}
      {isWide ? (
        <div className="w-[22rem] shrink-0">
          <NovelFilter layout="vertical" onFilterChange={handleFilterChange} />
        </div>
      ) : (
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" onClick={() => setShowFilter(!showFilter)}>
              Bộ lọc ⚙️
            </Button>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as "card" | "row")}
            >
              <ToggleGroupItem value="card">🗂️</ToggleGroupItem>
              <ToggleGroupItem value="row">📄</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div
            className={`transition-all duration-300 overflow-hidden ${
              showFilter ? "max-h-[1000px] opacity-100 mb-4" : "max-h-0 opacity-0"
            }`}
          >
            <NovelFilter layout="horizontal" onFilterChange={handleFilterChange} />
          </div>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">
          Truyện đã đăng bởi {user?.username || "bạn"}: {total}
        </h1>

        {/* Pagination top */}
        <PaginationCompact
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          className="mb-2"
        />

        <p className="text-center text-xs text-muted-foreground mb-4">
          Trang {page} / {totalPages}
        </p>

        {/* Novels */}
        {novels.length === 0 ? (
          <p className="text-center text-muted-foreground mt-8">
            Chưa có truyện nào được đăng.
          </p>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {novels.map((novel) => (
              <div key={novel._id} className="group relative hover:scale-[1.02] transition-transform">
                <NovelCard novel={novel} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center items-center gap-2">
                  <Button
                    className="bg-white text-black hover:bg-primary hover:text-white"
                    onClick={() => handleRead(novel._id)}
                  >
                    Đọc
                  </Button>
                  <Button
                    className="bg-white text-black hover:bg-primary hover:text-white"
                    onClick={() => handleEdit(novel._id)}
                  >
                    Sửa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {novels.map((novel) => (
              <Card
                key={novel._id}
                className="relative group p-3 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  {novel.coverImageUrl && (
                    <Image
                      src={novel.coverImageUrl}
                      alt={novel.title}
                      width={64}
                      height={80}
                      className="object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{novel.title}</h3>
                    <p className="text-sm text-muted-foreground">{novel.author}</p>
                    {!!novel.genres?.length && (
                      <p className="text-xs text-muted-foreground">
                        {novel.genres.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex justify-center items-center gap-2 rounded">
                  <Button
                    size="sm"
                    className="bg-white text-black hover:bg-primary hover:text-white"
                    onClick={() => handleRead(novel._id)}
                  >
                    Đọc
                  </Button>
                  <Button
                    size="sm"
                    className="bg-white text-black hover:bg-primary hover:text-white"
                    onClick={() => handleEdit(novel._id)}
                  >
                    Sửa
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination bottom */}
        <PaginationCompact page={page} totalPages={totalPages} onChange={setPage} className="mt-6" />
      </div>
    </div>
  );
}
