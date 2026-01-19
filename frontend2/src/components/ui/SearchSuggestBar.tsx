"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import NovelRow from "@/components/novel/NovelRow"; // 👈 component hiển thị từng truyện mini
import { useRouter } from "next/navigation";

interface Novel {
  _id: string;
  title: string;
  author?: string;
  poster?: { _id?: string; username?: string };
  coverImageUrl?: string;
}

interface SearchSuggestBarProps {
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onSelect?: (novel: Novel) => void;
  onSearch?: (q: string) => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export default function SearchSuggestBar({
  placeholder = "Tìm truyện...",
  size = "md",
  className,
  onSelect,
  onSearch,
  showCloseButton = false,
  onClose,
}: SearchSuggestBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const height =
    size === "sm" ? "h-8 text-sm" : size === "lg" ? "h-12 text-lg" : "h-10";

  // ✅ Debounce fetch 400ms
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
        const res = await fetch(`${base}/api/novels/search?q=${encodeURIComponent(query)}`);

        const data = await res.json();
        setResults(data.novels || []);
        setOpen(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ✅ Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Focus vào input khi component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-xl", className)}>
      {/* Ô nhập tìm kiếm */}
      <div className="relative flex items-center">
        <button
          type="button"
          aria-label="Search"
          onClick={() => {
              if (query.trim()) {
                if (onSearch) onSearch(query.trim());
                else router.push(`/search?q=${encodeURIComponent(query)}`);
                setOpen(false);
              }
            }}
          className="absolute left-3 w-8 h-8 text-muted-foreground hover:text-foreground flex items-center justify-center rounded-xs border border-transparent hover:bg-gray-100 hover:border-gray-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
        >
          <Search className="w-4 h-4" />
        </button>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn("pl-12 pr-4", height)}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => {
            setTimeout(() => {
              onClose?.();
            }, 150); // Delay to allow clicks on suggestions
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              if (onSearch) onSearch(query.trim());
              else router.push(`/search?q=${encodeURIComponent(query)}`);
              setOpen(false);
            }
          }}
        />
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-3 w-4 h-4 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}
        {loading && !showCloseButton && (
          <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Danh sách gợi ý */}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-background border rounded-lg shadow-md max-h-96 overflow-y-auto animate-in fade-in-0 zoom-in-95">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tìm kiếm...
            </div>
          ) : results.length > 0 ? (
            <>
              {results.slice(0, 5).map((novel) => (
                <div
                  key={novel._id}
                  role="button"
                  tabIndex={0}
                  className="focus:outline-none"
                  onClick={() => {
                    onSelect?.(novel);
                    // Navigate to novel detail (cover) page
                    router.push(`/novels/${novel._id}`);
                    setOpen(false);
                    setQuery("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSelect?.(novel);
                      router.push(`/novels/${novel._id}`);
                      setOpen(false);
                      setQuery("");
                    }
                  }}
                >
                  <NovelRow novel={novel} />
                </div>
              ))}
              <div
                role="button"
                tabIndex={0}
                className="focus:outline-none border-t"
                onClick={() => {
                  if (onSearch) onSearch(query.trim());
                  else router.push(`/search?q=${encodeURIComponent(query)}`);
                  setOpen(false);
                  setQuery("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (onSearch) onSearch(query.trim());
                    else router.push(`/search?q=${encodeURIComponent(query)}`);
                    setOpen(false);
                    setQuery("");
                  }
                }}
              >
                <div className="py-2 px-3 text-sm text-muted-foreground hover:bg-muted cursor-pointer text-center">
                  Xem thêm...
                </div>
              </div>
            </>
          ) : (
            <div className="py-3 text-center text-sm text-muted-foreground">
              Không tìm thấy truyện nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
