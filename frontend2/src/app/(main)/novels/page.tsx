import Link from 'next/link';
import NovelCard from "@/components/novel/NovelCard";

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
      {/* Nhiều lượt đọc */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Nhiều lượt đọc</h2>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-3 scroll-smooth no-scrollbar">
            {viewsNovels.map((novel) => (
              <div
                key={novel._id}
                className="group relative shrink-0 w-[150px] sm:w-[180px] transition-transform duration-300 hover:scale-[1.02]"
              >
                <div className="relative overflow-hidden rounded-md">
                  <NovelCard novel={novel} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] z-0" />
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Link
                      href={`/novels/${novel._id}`}
                      className="bg-white text-black font-medium py-2 px-4 rounded-md hover:bg-primary hover:text-white active:scale-95 transition-transform duration-150"
                    >
                      Đọc
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          {viewsNovels.length > 4 && (
            <>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white via-white/70 to-transparent" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                <Link
                  href="/novels?sortBy=views_desc"
                  className="bg-white/70 backdrop-blur-sm text-sm font-medium py-2 px-4 rounded-md hover:bg-primary hover:text-white active:scale-95 transition-transform duration-150"
                >
                  Xem thêm →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Nhiều review */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Nhiều review</h2>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-3 scroll-smooth no-scrollbar">
            {reviewsNovels.map((novel) => (
              <div
                key={novel._id}
                className="group relative shrink-0 w-[150px] sm:w-[180px] transition-transform duration-300 hover:scale-[1.02]"
              >
                <div className="relative overflow-hidden rounded-md">
                  <NovelCard novel={novel} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] z-0" />
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Link
                      href={`/novels/${novel._id}`}
                      className="bg-white text-black font-medium py-2 px-4 rounded-md hover:bg-primary hover:text-white active:scale-95 transition-transform duration-150"
                    >
                      Đọc
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          {reviewsNovels.length > 4 && (
            <>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white via-white/70 to-transparent" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                <Link
                  href="/novels?sortBy=reviews_desc"
                  className="bg-white/70 backdrop-blur-sm text-sm font-medium py-2 px-4 rounded-md hover:bg-primary hover:text-white active:scale-95 transition-transform duration-150"
                >
                  Xem thêm →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Mới hoàn thành */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Mới hoàn thành</h2>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-3 scroll-smooth no-scrollbar">
            {completedNovels.map((novel) => (
              <div
                key={novel._id}
                className="group relative shrink-0 w-[150px] sm:w-[180px] transition-transform duration-300 hover:scale-[1.02]"
              >
                <div className="relative overflow-hidden rounded-md">
                  <NovelCard novel={novel} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] z-0" />
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Link
                      href={`/novels/${novel._id}`}
                      className="bg-white text-black font-medium py-2 px-4 rounded-md hover:bg-primary hover:text-white active:scale-95 transition-transform duration-150"
                    >
                      Đọc
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          {completedNovels.length > 4 && (
            <>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white via-white/70 to-transparent" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                <Link
                  href="/novels?sortBy=completed_recent"
                  className="bg-white/70 backdrop-blur-sm text-sm font-medium py-2 px-4 rounded-md hover:bg-primary hover:text-white active:scale-95 transition-transform duration-150"
                >
                  Xem thêm →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Mới cập nhật */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Mới cập nhật</h2>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-3 scroll-smooth no-scrollbar">
            {updatedNovels.map((novel) => (
              <div
                key={novel._id}
                className="group relative shrink-0 w-[150px] sm:w-[180px] transition-transform duration-300 hover:scale-[1.02]"
              >
                <div className="relative overflow-hidden rounded-md">
                  <NovelCard novel={novel} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] z-0" />
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Link
                      href={`/novels/${novel._id}`}
                      className="bg-white text-black font-medium py-2 px-4 rounded-md hover:bg-primary hover:text-white active:scale-95 transition-transform duration-150"
                    >
                      Đọc
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          {updatedNovels.length > 4 && (
            <>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white via-white/70 to-transparent" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                <Link
                  href="/novels?sortBy=updated_recent"
                  className="bg-white/70 backdrop-blur-sm text-sm font-medium py-2 px-4 rounded-md hover:bg-primary hover:text-white active:scale-95 transition-transform duration-150"
                >
                  Xem thêm →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
