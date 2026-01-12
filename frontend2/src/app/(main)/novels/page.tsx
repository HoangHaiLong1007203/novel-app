import NovelCarousel from "@/components/novel/NovelCarousel";

interface Novel {
  _id: string;
  title: string;
  author?: string | { username: string };
  poster?: { username: string };
  coverImageUrl?: string;
  genres?: string[];
  status?: string;
  views?: number;
  commentsCount?: number;
  averageRating?: number;
}

async function fetchNovels(sortBy: string, limit: number = 7) {
  const res = await fetch(`http://localhost:5000/api/novels?sortBy=${sortBy}&limit=${limit}`, { cache: "no-store" });
  const { novels }: { novels: Novel[] } = await res.json();
  return novels;
}

export default async function NovelsPage() {
  const [viewsNovels, reviewsNovels, completedNovels, updatedNovels] = await Promise.all([
    fetchNovels("views_desc", 7),
    fetchNovels("reviews_desc", 7),
    fetchNovels("completed_recent", 7),
    fetchNovels("updated_recent", 7),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      <NovelCarousel title="Nhiều lượt đọc" novels={viewsNovels} moreHref="/novels?sortBy=views_desc" />

      <NovelCarousel title="Nhiều review" novels={reviewsNovels} moreHref="/novels?sortBy=reviews_desc" />

      <NovelCarousel title="Mới hoàn thành" novels={completedNovels} moreHref="/novels?sortBy=completed_recent" />

      <NovelCarousel title="Mới cập nhật" novels={updatedNovels} moreHref="/novels?sortBy=updated_recent" />
    </div>
  );
}
