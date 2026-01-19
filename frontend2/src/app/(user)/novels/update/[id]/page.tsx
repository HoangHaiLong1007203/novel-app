"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API } from "@/lib/api";
import { useAuth } from "@/hook/useAuth";
import NovelForm from "@/components/novel/NovelForm";
import ChapterList from "@/components/novel/ChapterList";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { toastApiError } from "@/lib/errors";
import ReasonDialog from "@/components/ui/ReasonDialog";


type NovelStatus = "còn tiếp" | "tạm ngưng" | "hoàn thành";

interface Novel {
  _id: string;
  title: string;
  author?: string;
  description?: string;
  genres?: string[];
  status?: NovelStatus;
  type?: "sáng tác" | "dịch/đăng lại";
  coverImageUrl?: string;
  poster?: { _id?: string };
}

interface Chapter {
  _id: string;
  chapterNumber?: number;
  title?: string;
}

// ChapterCreateForm moved to a reusable component: ChapterCreateDialog

export default function UpdateNovelPage() {
  const { id } = useParams();
  const router = useRouter();
  const novelId = Array.isArray(id) ? id[0] : id;
  const { user, loading: authLoading } = useAuth();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersAsc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteChapterOpen, setDeleteChapterOpen] = useState(false);
  const [pendingDeleteChapterId, setPendingDeleteChapterId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await API.get(`/api/novels/${id}`);
        const novelData = res.data?.novel || null;
        if (!mounted) return;
        setNovel(novelData);
        try {
          const chRes = await API.get(`/api/novels/${id}/chapters?sort=asc`);
          if (!mounted) return;
          setChapters(chRes.data?.chapters || []);
        } catch {
          if (!mounted) return;
          setChapters([]);
        }
      } catch (err) {
        console.error("Failed to load novel for update", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  // redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!authLoading && !user) {
      if (typeof window !== "undefined") {
        const redirect = encodeURIComponent(window.location.pathname);
        router.replace(`/login?redirect=${redirect}`);
      }
    }
  }, [authLoading, user, router]);

  // check ownership: only poster can edit
  useEffect(() => {
    if (loading || authLoading) return;
    if (novel && user) {
      const posterId = novel.poster?._id || null;
      const isAdmin = (user.role || "").toString().toLowerCase() === "admin";
      if (posterId && posterId !== user._id && !isAdmin) {
        // redirect back to novel page shortly
        setTimeout(() => router.replace(`/novels/${id}`), 1200);
      }
    }
  }, [novel, user, loading, authLoading, router, id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center">Đang tải...</div>;
  if (!novel) return <div className="min-h-[60vh] flex items-center justify-center">Không tìm thấy truyện.</div>;

  const isAdmin = (user?.role || "").toString().toLowerCase() === "admin";
  const canDelete = Boolean(user && (isAdmin || novel.poster?._id === user._id));
  const handleDelete = async (reason?: string) => {
    if (!canDelete || !id) return;
    setDeleting(true);
    try {
      await API.delete(`/api/novels/${id}`, { data: reason ? { reason } : {} });
      toast.success("Truyện đã được xóa");
      router.back();
    } catch (err) {
      toastApiError(err, "Không thể xóa truyện");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left: NovelForm */}
        <div className="w-full lg:w-2/3">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-lg font-semibold">Sửa truyện: {novel.title}</h2>
            {canDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  if (isAdmin) {
                    setDeleteOpen(true);
                    return;
                  }
                  const confirmed = typeof window !== "undefined" && window.confirm("Bạn có chắc muốn xóa truyện này không?");
                  if (!confirmed) return;
                  await handleDelete();
                }}
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xóa truyện"}
              </Button>
            ) : null}
          </div>
          <NovelForm
            user={user}
            novelId={Array.isArray(id) ? id[0] : id}
              initial={{
              title: novel.title || "",
              type: novel.type || "sáng tác",
              author: novel.author || "",
              description: novel.description || "",
              genres: novel.genres || [],
              status: novel.status || "còn tiếp",
              coverUrl: novel.coverImageUrl || undefined,
            }}
            onSuccess={() => router.push(`/novels/${id}`)}
          />
        </div>

        {/* Right: Chapters list */}
        <div className="w-full lg:w-1/3">
          <ChapterList
            chapters={chapters}
            mode="modify"
            novelId={Array.isArray(id) ? id[0] : id}
            initialAsc={chaptersAsc}
            onChangeChapters={(next: Chapter[]) => {
              setChapters(next);
            }}
            onRequestDelete={async (chapterId: string) => {
              if (!chapterId) return;
              setPendingDeleteChapterId(chapterId);
              setDeleteChapterOpen(true);
            }}
          />
        </div>
      </div>
      <ReasonDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa truyện"
        description="Bạn có thể nhập lý do (không bắt buộc)."
        confirmText="Xóa"
        onConfirm={async (reason) => {
          await handleDelete(reason);
        }}
      />
      <ReasonDialog
        open={deleteChapterOpen}
        onOpenChange={(open) => {
          setDeleteChapterOpen(open);
          if (!open) setPendingDeleteChapterId(null);
        }}
        title="Xóa chương"
        description="Bạn có thể nhập lý do (không bắt buộc)."
        confirmText="Xóa"
        onConfirm={async (reason) => {
          if (!pendingDeleteChapterId || !novelId) return;
          try {
            await API.delete(`/api/novels/${encodeURIComponent(novelId)}/chapters/${encodeURIComponent(pendingDeleteChapterId)}`, {
              data: reason ? { reason } : {},
            });
            setChapters((prev) => prev.filter((c) => c._id !== pendingDeleteChapterId));
            toast.success("Đã xóa chương");
          } catch (e) {
            toastApiError(e, "Xóa chương thất bại");
            console.error("Failed to delete chapter", e);
          } finally {
            setPendingDeleteChapterId(null);
          }
        }}
      />
    </div>
  );
}
