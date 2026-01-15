"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NovelCard from "@/components/novel/NovelCard";
import NovelRow from "@/components/novel/NovelRow";
import NovelFilter from "@/components/novel/NovelFilter";
import { API } from "@/lib/api";
import { Button, ToggleGroup, ToggleGroupItem } from "@/components/ui";
import PaginationCompact from "@/components/ui/PaginationCompact";
import SearchSuggestBar from "@/components/ui/SearchSuggestBar";

interface Novel {
  _id: string;
  title: string;
  description?: string;
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
  const searchParamsString = searchParams.toString();

  const [query, setQuery] = useState(qParam);
  useEffect(() => {
    // Re-read query + all params when search params change (including back/forward)
    const sp = searchParams;
    const q = sp.get("q") || "";
    setQuery(q);
    setPage(1);

    const initFilters: Filters = {
      categories: [],
      genres: [],
      status: [],
      chapterRange: [0, 2100],
      sortBy: null,
    };
    const types = sp.get("type");
    const gens = sp.get("genres");
    const stats = sp.get("status");
    const cmn = sp.get("chapterMin");
    const cmx = sp.get("chapterMax");
    const sb = sp.get("sortBy");
    if (types) initFilters.categories = types.split(",");
    if (gens) initFilters.genres = gens.split(",");
    if (stats) initFilters.status = stats.split(",");
    if (cmn) initFilters.chapterRange[0] = Math.max(0, parseInt(cmn));
    if (cmx) initFilters.chapterRange[1] = Math.min(2100, parseInt(cmx));
    if (sb) initFilters.sortBy = sb;
    setFilters(initFilters);
  }, [searchParamsString]);
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
  const [viewMode, setViewMode] = useState<"card" | "row">("card");
  const [showFilter, setShowFilter] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const fetchResults = useCallback(async () => {
    try {
      // Build params from current URL search params so URL is single source of truth
      const params = new URLSearchParams(searchParams.toString());
      // Ensure page & limit are set according to current state
      params.set("page", String(page));
      params.set("limit", viewMode === "card" ? (query.trim() ? "15" : "20") : "10");

      const endpoint = query.trim() ? "/api/novels/search" : "/api/novels";
      const res = await API.get(`${endpoint}?${params.toString()}`);
      const data = res.data;
      setNovels(data?.novels || []);
      setTotal(data?.pagination?.total || data?.novels?.length || 0);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Search fetch failed:", err);
      setNovels([]);
      setTotal(0);
      setTotalPages(1);
    }
  }, [searchParamsString, page, viewMode, query]);

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
    // Persist filters into URL so navigating away and back preserves them
    const params = new URLSearchParams();
    if (query.trim()) params.append("q", query);
    if (newFilters.categories?.length) params.append("type", newFilters.categories.join(","));
    if (newFilters.genres?.length) params.append("genres", newFilters.genres.join(","));
    if (newFilters.status?.length) params.append("status", newFilters.status.join(","));
    if (newFilters.chapterRange?.[0] > 0) params.append("chapterMin", String(newFilters.chapterRange[0]));
    if (newFilters.chapterRange?.[1] < 2100) params.append("chapterMax", String(newFilters.chapterRange[1]));
    if (newFilters.sortBy != null) params.append("sortBy", newFilters.sortBy as string);
    // keep page in URL (reset to 1)
    params.append("page", "1");
    // use replace to update current history entry (so back/forward behaves naturally)
    router.replace(`/search?${params.toString()}`);
  };

  

  return (
    <div className={`max-w-7xl mx-auto p-4 gap-6 ${isLargeScreen ? 'flex flex-row' : 'flex flex-col'}`}>
      {/* LEFT: Filter */}
      <div className={`w-full ${isLargeScreen ? 'lg:w-[22rem]' : ''} shrink-0 ${isLargeScreen || showFilter ? '' : 'hidden'}`}>
        <NovelFilter layout="vertical" onFilterChange={handleFilterChange} initialFilters={filters} />
      </div>

      {/* RIGHT: Results */}
      <div className="flex-1 max-w-4xl mx-auto">
        <div className="mb-4 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilter(!showFilter)}
            className={isLargeScreen ? 'hidden' : ''}
          >
            {showFilter ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </Button>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as "card" | "row")}
          >
            <ToggleGroupItem value="card">🗂️</ToggleGroupItem>
            <ToggleGroupItem value="row">📄</ToggleGroupItem>
          </ToggleGroup>
          <SearchSuggestBar
            placeholder="Tìm truyện (nhấn Enter để xem tất cả)..."
            onSelect={(n) => router.push(`/novels/${n._id}`)}
          />
        </div>

        <h1 className="text-lg font-semibold mb-2">
          Kết quả tìm kiếm cho &quot;{query}&quot;:
          <span className="block text-sm italic text-gray-700 mt-1">{total} kết quả đã được tìm thấy.</span>
        </h1>

        <PaginationCompact page={page} totalPages={totalPages} onChange={setPage} className="mb-3" />

        {novels.length === 0 ? (
          <p className="text-center text-muted-foreground mt-8">Không có kết quả.</p>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {novels.map((novel) => (
              <div key={novel._id} className="group relative hover:scale-[1.02] transition-transform">
                <NovelCard novel={novel} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(25rem, 1fr))' }}>
            {novels.map((novel) => (
              <NovelRow
                key={novel._id}
                novel={{
                  _id: novel._id,
                  title: novel.title,
                  author:
                    typeof novel.author === "string"
                      ? novel.author
                      : novel.author?.username,
                  description: novel.description,
                  genres: novel.genres,
                  coverImageUrl: novel.coverImageUrl,
                }}
              />
            ))}
          </div>
        )}

        <PaginationCompact page={page} totalPages={totalPages} onChange={setPage} className="mt-6" />
      </div>
    </div>
  );
}
