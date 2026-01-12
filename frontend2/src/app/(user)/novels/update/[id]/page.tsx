"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API } from "@/lib/api";
import { useAuth } from "@/hook/useAuth";
import NovelForm from "@/components/novel/NovelForm";
import ChapterList from "@/components/novel/ChapterList";


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
  const { user, loading: authLoading } = useAuth();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersAsc] = useState(true);
  const [loading, setLoading] = useState(true);

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
      const posterId = (novel.poster && novel.poster._id) || null;
      if (posterId && posterId !== user._id) {
        // redirect back to novel page shortly
        setTimeout(() => router.replace(`/novels/${id}`), 1200);
      }
    }
  }, [novel, user, loading, authLoading, router, id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center">Đang tải...</div>;
  if (!novel) return <div className="min-h-[60vh] flex items-center justify-center">Không tìm thấy truyện.</div>;

  return (
    <div className="max-w-7xl mx-auto p-4">

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left: NovelForm */}
        <div className="w-full lg:w-2/3">
          <div className=" items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sửa truyện: {novel.title}</h2>
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
          />
        </div>
      </div>
    </div>
  );
}
