"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/lib/api";
import NovelCard from "@/components/novel/NovelCard";
import NovelRow from "@/components/novel/NovelRow";
import NovelFilter from "@/components/novel/NovelFilter";
import { Button, ToggleGroup, ToggleGroupItem } from "@/components/ui";
import PaginationCompact from "@/components/ui/PaginationCompact";

interface Props {
  initialFetchParams?: Record<string, string>;
  editable?: boolean;
  title?: string;
  showFilter?: boolean;
}

interface Novel {
  _id: string;
  title: string;
  author: string | { username?: string };
  poster?: { username: string } | { _id?: string; username?: string };
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
export default function NovelsListPage({ initialFetchParams = {}, editable = false, title = "Danh sách truyện", showFilter = false }: Props) {
  const router = useRouter();
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
  const [showFilterLocal, setShowFilterLocal] = useState(showFilter);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const fetchNovels = useCallback(async () => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", viewMode === "card" ? "20" : "10");
    Object.entries(initialFetchParams || {}).forEach(([k, v]) => params.append(k, v));

    if (filters.categories.length) params.append("type", filters.categories.join(","));
    if (filters.genres.length) params.append("genres", filters.genres.join(","));
    if (filters.status.length) params.append("status", filters.status.join(","));
    if (filters.chapterRange[0] > 0) params.append("chapterMin", filters.chapterRange[0].toString());
    if (filters.chapterRange[1] < 2100) params.append("chapterMax", filters.chapterRange[1].toString());
    if (filters.sortBy) params.append("sortBy", filters.sortBy);

    try {
      const res = await API.get(`/api/novels?${params.toString()}`);
      const data = res.data;
      setNovels(data?.novels || []);
      setTotal(data?.pagination?.total ?? data?.novels?.length ?? 0);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch (err) {
      console.error("NovelsListPage fetchNovels error:", err);
      setNovels([]);
      setTotal(0);
      setTotalPages(1);
    }
  }, [page, viewMode, filters, initialFetchParams]);

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleRead = (id: string) => router.push(`/novels/${id}`);
  const handleEdit = (id: string) => router.push(`/novels/update/${id}`);

  return (
    <div className={`max-w-7xl mx-auto p-4 gap-6 ${isLargeScreen ? 'flex flex-row' : 'flex flex-col'}`}>
      <div className={`w-full ${isLargeScreen ? 'lg:w-[22rem]' : ''} shrink-0 ${isLargeScreen || showFilterLocal ? '' : 'hidden'}`}>
        <NovelFilter layout="vertical" onFilterChange={handleFilterChange} />
      </div>

      <div className="flex-1 max-w-4xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowFilterLocal(!showFilterLocal)}
            className={isLargeScreen ? 'hidden' : ''}
          >
            {showFilterLocal ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </Button>

          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "card" | "row")}>
            <ToggleGroupItem value="card">🗂️</ToggleGroupItem>
            <ToggleGroupItem value="row">📄</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <h1 className="text-xl font-semibold mb-4">{title}: {total}</h1>

        <PaginationCompact page={page} totalPages={totalPages} onChange={setPage} className="mb-2" />

        <p className="text-center text-xs text-muted-foreground mb-4">Trang {page} / {totalPages}</p>

        {novels.length === 0 ? (
          <p className="text-center text-muted-foreground mt-8">Chưa có truyện nào.</p>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {novels.map((novel) => (
              <div key={novel._id} className="hover:scale-[1.02] transition-transform">
                <NovelCard
                  novel={novel}
                  mode={editable ? "edit" : "read"}
                  onRead={handleRead}
                  onEdit={handleEdit}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(25rem, 1fr))' }}>
            {novels.map((novel) => {
              const rowNovel = {
                _id: novel._id,
                title: novel.title,
                author: typeof novel.author === 'string' ? novel.author : (novel.author?.username ?? ''),
                description: undefined,
                genres: novel.genres,
                coverImageUrl: novel.coverImageUrl,
              };
              return (
                <NovelRow
                  key={novel._id}
                  novel={rowNovel}
                  mode={editable ? "edit" : "read"}
                  onRead={handleRead}
                  onEdit={handleEdit}
                />
              );
            })}
          </div>
        )}

        <PaginationCompact page={page} totalPages={totalPages} onChange={setPage} className="mt-6" />
      </div>
    </div>
  );
}
