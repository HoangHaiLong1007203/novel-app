"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NovelCard from "@/components/novel/NovelCard";
import NovelFilter from "@/components/novel/NovelFilter";
import { API } from "@/lib/api";
import { Button } from "@/components/ui";
import PaginationCompact from "@/components/ui/PaginationCompact";
import SearchSuggestBar from "@/components/ui/SearchSuggestBar";

interface Novel {
  _id: string;
  title: string;
  author?: string | { username: string };
  poster?: { username: string };
  coverImageUrl?: string;
  genres?: string[];
  status?: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(qParam);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  interface Filters {
    categories: string[];
    genres: string[];
    status: string[];
    chapterRange: [number, number];
    sortBy: string | null;
  }
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    genres: [],
    status: [],
    chapterRange: [0, 2100],
    sortBy: null,
  });
  const [viewMode] = useState<"card" | "row">("card");
  const [showFilter, setShowFilter] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const fetchResults = useCallback(async () => {
    try {
      // If query present, use search endpoint which now supports pagination
      if (query.trim()) {
        const res = await API.get(`/api/novels/search?q=${encodeURIComponent(query)}&page=${page}&limit=15`);
        const data = res.data;
        setNovels(data?.novels || []);
        setTotal(data?.pagination?.total || data?.novels?.length || 0);
        setTotalPages(data?.pagination?.totalPages || 1);
      } else {
        // No free-text query -> use regular listing with filters
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", viewMode === "card" ? "20" : "10");
        if (filters.categories?.length) params.append("type", filters.categories.join(","));
        if (filters.genres?.length) params.append("genres", filters.genres.join(","));
        if (filters.status?.length) params.append("status", filters.status.join(","));
        if (filters.chapterRange?.[0] > 0) params.append("chapterMin", String(filters.chapterRange[0]));
        if (filters.chapterRange?.[1] < 2100) params.append("chapterMax", String(filters.chapterRange[1]));
        if (filters.sortBy) params.append("sortBy", filters.sortBy);

        const res = await API.get(`/api/novels?${params.toString()}`);
        const data = res.data;
        setNovels(data?.novels || []);
        setTotal(data?.pagination?.total || data?.novels?.length || 0);
        setTotalPages(data?.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Search fetch failed:", err);
      setNovels([]);
      setTotal(0);
      setTotalPages(1);
    }
  }, [query, page, filters, viewMode]);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSearchSubmit = (q: string) => {
    // update URL param so users can share
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.replace(`/search?${params.toString()}`);
    setQuery(q);
    setPage(1);
  };

  return (
    <div className={`max-w-7xl mx-auto p-4 gap-6 ${isLargeScreen ? 'flex flex-row' : 'flex flex-col'}`}>
      {/* LEFT: Filter */}
      <div className={`w-full ${isLargeScreen ? 'lg:w-[22rem]' : ''} shrink-0 ${isLargeScreen || showFilter ? '' : 'hidden'}`}>
        <NovelFilter layout="vertical" onFilterChange={handleFilterChange} />
      </div>

      {/* RIGHT: Results */}
      <div className="flex-1">
        <div className="mb-4 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilter(!showFilter)}
            className={isLargeScreen ? 'hidden' : ''}
          >
            {showFilter ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </Button>
          <SearchSuggestBar
            placeholder="Tìm truyện (nhấn Enter để xem tất cả)..."
            onSelect={(n) => router.push(`/novels/${n._id}`)}
          />
          <Button onClick={() => handleSearchSubmit(query)}>
            Tìm
          </Button>
        </div>

        <h1 className="text-lg font-semibold mb-2">Kết quả tìm kiếm: {total}</h1>

        <PaginationCompact page={page} totalPages={totalPages} onChange={setPage} className="mb-3" />

        {novels.length === 0 ? (
          <p className="text-center text-muted-foreground mt-8">Không có kết quả.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {novels.map((novel) => (
              <div key={novel._id} className="group relative hover:scale-[1.02] transition-transform">
                <NovelCard novel={novel} />
              </div>
            ))}
          </div>
        )}

        <PaginationCompact page={page} totalPages={totalPages} onChange={setPage} className="mt-6" />
      </div>
    </div>
  );
}
