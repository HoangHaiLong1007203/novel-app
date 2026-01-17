"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NovelCard from "@/components/novel/NovelCard";
import NovelRow from "@/components/novel/NovelRow";
import NovelFilter from "@/components/novel/NovelFilter";
import { API } from "@/lib/api";
import { Button, ToggleGroup, ToggleGroupItem } from "@/components/ui";
import PaginationCompact from "@/components/ui/PaginationCompact";
import SearchSuggestBar from "@/components/ui/SearchSuggestBar";

export interface NovelSearchItem {
  _id: string;
  title: string;
  description?: string;
  author?: string | { username: string };
  poster?: { username: string };
  coverImageUrl?: string;
  genres?: string[];
  status?: string;
  views?: number;
  commentsCount?: number;
  averageRating?: number;
}

interface Filters {
  categories: string[];
  genres: string[];
  status: string[];
  chapterRange: [number, number];
  sortBy: string | null;
}

interface NovelSearchPanelProps {
  basePath?: string;
  heading?: string;
  renderActions?: (novel: NovelSearchItem) => React.ReactNode;
  defaultViewMode?: "card" | "row";
  className?: string;
  mode?: "read" | "edit";
  onRead?: (novelId: string) => void;
  onEdit?: (novelId: string) => void;
}

const DEFAULT_FILTERS: Filters = {
  categories: [],
  genres: [],
  status: [],
  chapterRange: [0, 2100],
  sortBy: null,
};

export default function NovelSearchPanel({
  basePath = "/search",
  heading,
  renderActions,
  defaultViewMode = "card",
  className,
  mode = "read",
  onRead,
  onEdit,
}: NovelSearchPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const qParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(qParam);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [novels, setNovels] = useState<NovelSearchItem[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "row">(defaultViewMode);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const handleRead = useCallback(
    (id: string) => {
      if (onRead) return onRead(id);
      router.push(`/novels/${id}`);
    },
    [onRead, router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      if (onEdit) return onEdit(id);
      router.push(`/novels/update/${id}`);
    },
    [onEdit, router]
  );

  useEffect(() => {
    const sp = new URLSearchParams(searchParamsString);
    const q = sp.get("q") || "";
    setQuery(q);
    setPage(parseInt(sp.get("page") || "1", 10));

    const initFilters: Filters = { ...DEFAULT_FILTERS };
    const types = sp.get("type");
    const gens = sp.get("genres");
    const stats = sp.get("status");
    const cmn = sp.get("chapterMin");
    const cmx = sp.get("chapterMax");
    const sb = sp.get("sortBy");
    if (types) initFilters.categories = types.split(",");
    if (gens) initFilters.genres = gens.split(",");
    if (stats) initFilters.status = stats.split(",");
    if (cmn) initFilters.chapterRange[0] = Math.max(0, parseInt(cmn, 10));
    if (cmx) initFilters.chapterRange[1] = Math.min(2100, parseInt(cmx, 10));
    if (sb) initFilters.sortBy = sb;
    setFilters(initFilters);
  }, [searchParamsString]);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      const params = new URLSearchParams(searchParamsString);
      params.set("page", String(page));
      params.set("limit", viewMode === "card" ? (query.trim() ? "10" : "10") : "10");

      const endpoint = query.trim() ? "/api/novels/search" : "/api/novels";
      const res = await API.get(`${endpoint}?${params.toString()}`);
      const data = res.data;
      setNovels(data?.novels || []);
      setTotal(data?.pagination?.total || data?.novels?.length || 0);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("NovelSearchPanel fetch failed:", err);
      setNovels([]);
      setTotal(0);
      setTotalPages(1);
    }
  }, [searchParamsString, page, viewMode, query]);

  useEffect(() => {
    void fetchResults();
  }, [fetchResults]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
    const params = new URLSearchParams();
    if (query.trim()) params.append("q", query);
    if (newFilters.categories.length) params.append("type", newFilters.categories.join(","));
    if (newFilters.genres.length) params.append("genres", newFilters.genres.join(","));
    if (newFilters.status.length) params.append("status", newFilters.status.join(","));
    if (newFilters.chapterRange[0] > 0) params.append("chapterMin", String(newFilters.chapterRange[0]));
    if (newFilters.chapterRange[1] < 2100) params.append("chapterMax", String(newFilters.chapterRange[1]));
    if (newFilters.sortBy != null) params.append("sortBy", newFilters.sortBy);
    params.append("page", "1");
    const tabParam = searchParams.get("tab");
    if (tabParam) params.append("tab", tabParam);
    router.replace(`${basePath}?${params.toString()}`);
  };

  const resolvedHeading = useMemo(() => {
    if (heading) return heading;
    return query ? `Kết quả tìm kiếm cho "${query}"` : "Khám phá truyện";
  }, [heading, query]);

  return (
    <div className={`max-w-7xl mx-auto p-4 gap-6 ${isLargeScreen ? "flex flex-row" : "flex flex-col"} ${className ?? ""}`}>
      <div className={`w-full ${isLargeScreen ? "lg:w-[22rem]" : ""} shrink-0 ${isLargeScreen || showFilter ? "" : "hidden"}`}>
        <NovelFilter layout="vertical" onFilterChange={handleFilterChange} initialFilters={filters} />
      </div>

      <div className="flex-1 max-w-4xl mx-auto">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilter(!showFilter)}
            className={isLargeScreen ? "hidden" : ""}
          >
            {showFilter ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
          </Button>
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "card" | "row")}>
            <ToggleGroupItem value="card">🗂️</ToggleGroupItem>
            <ToggleGroupItem value="row">📄</ToggleGroupItem>
          </ToggleGroup>
          <SearchSuggestBar
            placeholder="Tìm truyện (nhấn Enter để xem tất cả)..."
            onSelect={(n) => router.push(`/novels/${n._id}`)}
            onSearch={(q) => {
              const params = new URLSearchParams();
              if (q) params.append("q", q);
              if (filters.categories.length) params.append("type", filters.categories.join(","));
              if (filters.genres.length) params.append("genres", filters.genres.join(","));
              if (filters.status.length) params.append("status", filters.status.join(","));
              if (filters.chapterRange[0] > 0) params.append("chapterMin", String(filters.chapterRange[0]));
              if (filters.chapterRange[1] < 2100) params.append("chapterMax", String(filters.chapterRange[1]));
              if (filters.sortBy != null) params.append("sortBy", filters.sortBy);
              params.append("page", "1");
              const tabParam = searchParams.get("tab");
              if (tabParam) params.append("tab", tabParam);
              router.replace(`${basePath}?${params.toString()}`);
            }}
          />
        </div>

        <h1 className="text-lg font-semibold mb-2">
          {resolvedHeading}
          <span className="block text-sm italic text-muted-foreground mt-1">
            {total} truyện phù hợp.
          </span>
        </h1>

        <PaginationCompact page={page} totalPages={totalPages} onChange={setPage} className="mb-3" />

        {novels.length === 0 ? (
          <p className="text-center text-muted-foreground mt-8">Không có kết quả.</p>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {novels.map((novel) => (
              <div key={novel._id} className={`relative ${renderActions ? "group" : ""}`}>
                <NovelCard
                  novel={novel}
                  mode={renderActions ? "read" : mode}
                  onRead={handleRead}
                  onEdit={handleEdit}
                />
                {renderActions ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="pointer-events-auto flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                      {renderActions(novel)}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(25rem, 1fr))" }}>
            {novels.map((novel) => (
              <NovelRow
                key={novel._id}
                novel={{
                  _id: novel._id,
                  title: novel.title,
                  author: typeof novel.author === "string" ? novel.author : novel.author?.username,
                  description: novel.description,
                  genres: novel.genres,
                  coverImageUrl: novel.coverImageUrl,
                }}
                actions={renderActions ? renderActions(novel) : undefined}
                mode={renderActions ? "read" : mode}
                onRead={handleRead}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

        <PaginationCompact page={page} totalPages={totalPages} onChange={setPage} className="mt-6" />
      </div>
    </div>
  );
}
