import NovelCard from "@/components/novel/NovelCard";
import NovelRow from "@/components/novel/NovelRow";

interface Author {
  username: string;
}

interface Novel {
  _id: string;
  title: string;
  author?: Author;
  description?: string;
  genres?: string[];
  coverImageUrl?: string;
  status?: string;
  views?: number;
  commentsCount?: number;
  averageRating?: number;
}

export default async function NovelsPage() {
  const res = await fetch("http://localhost:5000/api/novels", { cache: "no-store" });
  const { novels }: { novels: Novel[] } = await res.json();

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-lg font-semibold">Gợi ý hôm nay</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {novels.slice(0, 10).map((n) => (
          <NovelCard key={n._id} novel={n} />
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-6">Mới cập nhật</h2>
      <div className="space-y-3">
        {novels.slice(10, 20).map((n) => (
          <NovelRow key={n._id} novel={n} />
        ))}
      </div>
    </div>
  );
}
