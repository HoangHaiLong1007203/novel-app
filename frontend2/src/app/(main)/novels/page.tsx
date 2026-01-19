import NovelCarousel from "@/components/novel/NovelCarousel";

interface Novel {
  _id: string;
  title: string;
  author?: string | { username: string };
  poster?: { _id?: string; username: string };
  coverImageUrl?: string;
  genres?: string[];
  status?: string;
  views?: number;
  commentsCount?: number;
  averageRating?: number;
}

async function fetchNovels(sortBy: string, limit: number = 7) {
  const isServer = typeof window === "undefined";
  // Dev-only workaround: tránh lỗi TLS khi backend dùng self-signed cert.
  if (isServer && process.env.NODE_ENV !== "production") {
    // Chỉ dùng trong môi trường dev local với mkcert.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  // Prefer explicit env var; for server-side rendering fall back to backend default.
  const base = process.env.NEXT_PUBLIC_API_URL || (isServer ? `http://localhost:5000` : "");
  const params = new URLSearchParams({ sortBy, limit: String(limit) });
  if (sortBy === "completed_recent") {
    params.set("status", "hoàn thành");
  }
  const url = `${base}/api/novels?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  const { novels }: { novels: Novel[] } = await res.json();
  return novels;
}

export default async function NovelsPage() {
  const [viewsNovels, reviewsNovels, recommendationNovels, completedNovels, updatedNovels] = await Promise.all([
    fetchNovels("views_desc", 7),
    fetchNovels("reviews_desc", 7),
    fetchNovels("recommendations_desc", 7),
    fetchNovels("completed_recent", 7),
    fetchNovels("updated_recent", 7),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      <NovelCarousel title="Nhiều lượt đọc" novels={viewsNovels} moreHref="/search?sortBy=views_desc" />

      <NovelCarousel title="Nhiều review" novels={reviewsNovels} moreHref="/search?sortBy=reviews_desc" />

      <NovelCarousel title="Đề cử" novels={recommendationNovels} moreHref="/search?sortBy=recommendations_desc" />

      <NovelCarousel title="Mới hoàn thành" novels={completedNovels} moreHref="/search?sortBy=completed_recent" />

      <NovelCarousel title="Mới cập nhật" novels={updatedNovels} moreHref="/search?sortBy=updated_recent" />
    </div>
  );
}
