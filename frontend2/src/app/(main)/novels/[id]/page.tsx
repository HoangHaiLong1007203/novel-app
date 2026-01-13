// app/novels/[id]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import RatingComment from "@/components/novel/RatingComment";
import ReviewCommentPane from "@/components/novel/ReviewCommentPane";
import ChapterList from "../../../../components/novel/ChapterList";
import NovelStats from "@/components/novel/NovelStats";
import NovelCarousel from "@/components/novel/NovelCarousel";
import NovelTile from "@/components/novel/NovelTile";
import { API, addBookmark, getUserBookmarks, removeBookmark } from "@/lib/api";

interface Novel {
  _id: string;
  title: string;
  author?: string;
  description?: string;
  genres?: string[];
  status?: string;
  coverImageUrl?: string;
  viewCount?: number;
  poster?: { _id?: string; username?: string };
}


interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
}

interface Review {
  _id: string;
  user: { username: string; avatarUrl?: string };
  rating: number;
  content: string;
  createdAt: string;
}

interface Comment {
  _id: string;
  user: { username: string; avatarUrl?: string };
  content: string;
  createdAt: string;
}
export default function NovelDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [showReviewComposer, setShowReviewComposer] = useState(false);
  const router = useRouter();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lastReadChapterId, setLastReadChapterId] = useState<string | null>(null);
  const [chaptersAsc] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorNovels, setAuthorNovels] = useState<Novel[]>([]);
  const [posterNovels, setPosterNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [inBookshelf, setInBookshelf] = useState(false);
  const [removing, setRemoving] = useState(false);

  const normalizedNovelId = useMemo(() => {
    if (typeof id === "string") return id;
    if (Array.isArray(id)) return id[0];
    return "";
  }, [id]);

  useEffect(() => {
    // Check if this novel is already bookmarked
    if (!normalizedNovelId) return;
    if (!user) {
      setInBookshelf(false);
      return;
    }

    let mounted = true;
    getUserBookmarks(1, 1, normalizedNovelId)
      .then((res) => {
        if (!mounted) return;
        const bookmarks = res?.bookmarks || [];
        setInBookshelf(bookmarks.length > 0);
      })
      .catch(() => {
        if (!mounted) return;
        setInBookshelf(false);
      });

    return () => {
      mounted = false;
    };
  }, [normalizedNovelId, user]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await API.get(`/api/novels/${id}`);
        setNovel(res.data?.novel || null);
        console.log("[debug] fetched novel:", res.data?.novel);
        const chaptersRes = await API.get(`/api/novels/${id}/chapters?sort=asc`);
        setChapters(chaptersRes.data?.chapters || []);
        // Fetch reviews và reading progress nếu có token
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (accessToken && accessToken !== 'undefined' && accessToken !== 'null') {
          try {
            const reviewsRes = await API.get(`/api/reviews/novel/${id}`);
            setReviews(reviewsRes.data?.reviews || []);
          } catch {
            setReviews([]);
          }
          // Try fetching detailed reading progress to know last-read chapter
          try {
            const rpRes = await API.get(`/api/reading-progress/${id}`);
            const rp = rpRes.data?.readingProgress;
            const sessionLast = rp?.readingSessions?.length ? rp.readingSessions[rp.readingSessions.length - 1]?.chapter : null;
            const readChLast = rp?.readChapters?.length ? (rp.readChapters[rp.readChapters.length - 1]._id || rp.readChapters[rp.readChapters.length - 1]) : null;
            const lastId = sessionLast?.toString() || readChLast?.toString() || null;
            setLastReadChapterId(lastId || null);
          } catch {
            setLastReadChapterId(null);
          }
        } else {
          setReviews([]);
        }
        // Fetch comments (route public)
        const commentsRes = await API.get(`/api/comments/novel/${id}`);
        setComments(commentsRes.data?.comments || []);

        // Fetch novels by same author (public)
        const novelAuthor = res.data?.novel?.author;
        if (novelAuthor) {
          try {
            const authorUrl = `/api/novels?author=${encodeURIComponent(novelAuthor)}&limit=5`;
            console.log("[debug] author query url:", authorUrl);
            const authorRes = await API.get(authorUrl);
            const list = authorRes.data?.novels || [];
            setAuthorNovels(list as Novel[]);
            console.log("[debug] fetched authorNovels for", novelAuthor, list.length);
          } catch {
            setAuthorNovels([]);
          }
        }

        // Fetch novels by same poster (public)
        const posterId = res.data?.novel?.poster?._id;
        if (posterId) {
          try {
            const posterRes = await API.get(`/api/novels?poster=${encodeURIComponent(posterId)}&limit=5`);
            const list = posterRes.data?.novels || [];
            // keep the current novel in the returned list for verification
            setPosterNovels(list as Novel[]);
            console.log("[debug] fetched posterNovels for", posterId, list.length);
          } catch {
            setPosterNovels([]);
          }
        }
      } catch (err) {
        console.error("Không thể tải truyện:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Đang tải truyện...</p>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Không tìm thấy truyện.</p>
      </div>
    );
  }

  const {
    title,
    author = "Chưa rõ",
    description = "Chưa có mô tả.",
    genres = [],
    status = "Còn tiếp",
    coverImageUrl = "/default-cover.jpg",
  } = novel || {};

  const firstChapter = chapters.length > 0 ? chapters[0] : null;

  return (
    <div className="relative min-h-screen text-white">
      {/* --- ảnh nền mờ --- */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={coverImageUrl}
          alt={title}
          fill
          className="object-cover blur-2xl scale-110"
          priority
        />
      </div>

      {/* --- nội dung --- */}
      <div className="max-w-5xl mx-auto p-6">
        {/* header info */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="relative w-44 h-60 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
            <Image
              src={coverImageUrl}
              alt={title}
              fill
              sizes="176px"
              className="object-cover"
            />
          </div>

          <div className="flex-1 space-y-3">
            <h1 className="text-2xl font-bold leading-tight">{title}</h1>
            <p className="text-sm opacity-80">Tác giả: {author}</p>

            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <Badge key={g} variant="secondary" className="bg-primary/30 text-white">
                  {g}
                </Badge>
              ))}
            </div>

            <p className="text-sm opacity-80">Trạng thái: {status}</p>

            <div className="flex gap-3 mt-4">
              {firstChapter ? (
                <Link href={lastReadChapterId ? `/novels/${id}/chapters/${lastReadChapterId}` : `/novels/${id}/chapters/${firstChapter._id}`}>
                  <Button>Đọc truyện</Button>
                </Link>
              ) : (
                <Button disabled>Đọc truyện</Button>
              )}
              {inBookshelf ? (
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!user || !normalizedNovelId) {
                      setShowLoginDialog(true);
                      return;
                    }
                    try {
                      setRemoving(true);
                      await removeBookmark(normalizedNovelId);
                      setInBookshelf(false);
                    } catch (e) {
                      console.error("Không thể xóa khỏi tủ truyện:", e);
                    } finally {
                      setRemoving(false);
                    }
                  }}
                  disabled={removing}
                >
                  {removing ? "Đang xóa..." : "Xóa khỏi tủ truyện"}
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!user || !normalizedNovelId) {
                        setShowLoginDialog(true);
                        return;
                      }

                      try {
                        setAdding(true);
                        await addBookmark(normalizedNovelId);
                        setInBookshelf(true);
                      } catch (e) {
                        console.error("Không thể thêm vào tủ truyện:", e);
                      } finally {
                        setAdding(false);
                      }
                    }}
                    disabled={adding}
                  >
                    {adding ? "Đang thêm..." : "Thêm vào tủ truyện"}
                  </Button>

                  <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Yêu cầu đăng nhập</DialogTitle>
                        <DialogDescription>cần phải đăng nhập để thêm vào tủ truyện</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowLoginDialog(false)}>Để sau</Button>
                        <Button
                          onClick={() => {
                            setShowLoginDialog(false);
                            router.push(`/login?redirect=${encodeURIComponent(`/novels/${id}`)}`);
                          }}
                        >
                          Ok
                        </Button>
                      </DialogFooter>
                      <DialogClose />
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Giới thiệu, Đánh giá, Comment, Danh sách chương */}
        <div className="mt-8 bg-background/60 backdrop-blur-sm rounded-xl p-4 text-foreground">
          <Tabs defaultValue="gioithieu" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="gioithieu" className="flex-1">Giới thiệu</TabsTrigger>
              <TabsTrigger value="danhgia" className="flex-1">Đánh giá</TabsTrigger>
              <TabsTrigger value="comment" className="flex-1">Bình luận</TabsTrigger>
              <TabsTrigger value="chuong" className="flex-1">Danh sách chương</TabsTrigger>
            </TabsList>
            <TabsContent value="gioithieu">
              <NovelStats
                chapterCount={chapters.length}
                status={status}
                viewCount={novel?.viewCount || 0}
              />
              <p className="text-sm leading-relaxed whitespace-pre-line" style={description ? { textAlign: 'justify' } : {}}>{description}</p>
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-base">Thể loại</h3>
                <div className="flex flex-wrap gap-2">
                  {genres.length > 0 ? genres.map((g) => (
                    <Badge
                      key={g}
                      className="cursor-pointer px-3 py-1 bg-secondary text-foreground hover:bg-primary hover:text-white transition-colors"
                      // onClick={() => ...} // Nếu muốn filter hoặc chuyển trang thể loại
                    >
                      {g}
                    </Badge>
                  )) : <span className="text-xs opacity-60">Chưa có thể loại</span>}
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-base">Truyện cùng tác giả</h3>
                {authorNovels.length > 0 ? (
                  <NovelCarousel
                    title={`Cùng tác giả: ${author}`}
                    novels={authorNovels.slice(0, 5)}
                    moreHref={`/search?author=${encodeURIComponent(author)}`}
                    ItemComponent={NovelTile}
                    direction="horizontal"
                  />
                ) : (
                  <div className="text-sm opacity-70">Không tìm thấy truyện cùng tác giả.</div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-base">Truyện cùng người đăng</h3>
                {posterNovels.length > 0 ? (
                  <NovelCarousel
                    title={`Cùng người đăng: ${novel?.poster?.username || ""}`}
                    novels={posterNovels.slice(0, 5)}
                    moreHref={`/user/${novel?.poster?._id}`}
                    ItemComponent={NovelTile}
                    direction="horizontal"
                  />
                ) : (
                  <div className="text-sm opacity-70">Không tìm thấy truyện cùng người đăng.</div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="danhgia">
              <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-5xl transform -translate-x-1/2 px-6 pointer-events-none">
                <div className="flex justify-end pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => setShowReviewComposer((s) => !s)}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg"
                    aria-label={showReviewComposer ? "Đóng" : "Viết đánh giá"}
                  >
                    {showReviewComposer ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20h9" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    )}
                  </button>
                </div>

                {showReviewComposer && (
                  <div className="mt-3 pointer-events-auto">
                    <RatingComment novelId={typeof id === 'string' ? id : String(id)} mode="review" onCreated={(rv) => { setReviews((prev) => [rv as Review, ...prev]); setShowReviewComposer(false); }} />
                  </div>
                )}
              </div>

              <ReviewCommentPane mode="review" items={reviews} currentUserId={user?._id ?? null} onReply={undefined} onReport={undefined} onDelete={undefined} />
            </TabsContent>
            <TabsContent value="comment">
              <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-5xl transform -translate-x-1/2 px-6">
                {firstChapter ? (
                  <RatingComment
                    novelId={typeof id === 'string' ? id : String(id)}
                    chapterId={firstChapter._id}
                    mode="comment"
                    onCreated={(cm) => {
                      setComments((prev) => [cm as Comment, ...prev]);
                      const pane = document.getElementById("comment-pane");
                      if (pane) pane.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                ) : (
                  <div className="text-sm opacity-80 text-center">Không có chương để bình luận.</div>
                )}
              </div>
              <ReviewCommentPane id="comment-pane" mode="comment" items={comments} currentUserId={user?._id ?? null} onReply={undefined} onReport={undefined} onDelete={undefined} />
            </TabsContent>
            <TabsContent value="chuong">
              <ChapterList chapters={chapters} mode="read" novelId={normalizedNovelId} initialAsc={chaptersAsc} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
