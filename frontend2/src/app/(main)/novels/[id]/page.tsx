// app/novels/[id]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { API } from "@/lib/api";

interface Novel {
  _id: string;
  title: string;
  author?: string;
  description?: string;
  genres?: string[];
  status?: string;
  coverImageUrl?: string;
}

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
}

export default function NovelDetailPage() {
  const { id } = useParams();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await API.get(`/api/novels/${id}`);
        setNovel(res.data?.novel || null);
        const chaptersRes = await API.get(`/api/novels/${id}/chapters?sort=asc`);
        setChapters(chaptersRes.data?.chapters || []);
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
  } = novel;

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
          <div className="w-44 h-60 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
            <Image
              src={coverImageUrl}
              alt={title}
              width={176}
              height={240}
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
                <Link href={`/novels/${id}/chapters/${firstChapter._id}`}>
                  <Button>Đọc truyện</Button>
                </Link>
              ) : (
                <Button disabled>Đọc truyện</Button>
              )}
              <Button variant="secondary">Thêm vào tủ truyện</Button>
            </div>
          </div>
        </div>

        {/* Tabs: Giới thiệu, Đánh giá, Comment, Danh sách chương */}
        <div className="mt-8 bg-background/60 backdrop-blur-sm rounded-xl p-4 text-foreground">
          <Tabs defaultValue="gioithieu" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="gioithieu" className="flex-1">Giới thiệu</TabsTrigger>
              <TabsTrigger value="danhgia" className="flex-1">Đánh giá</TabsTrigger>
              <TabsTrigger value="comment" className="flex-1">Comment</TabsTrigger>
              <TabsTrigger value="chuong" className="flex-1">Danh sách chương</TabsTrigger>
            </TabsList>
            <TabsContent value="gioithieu">
              <h2 className="text-lg font-semibold mb-2">Giới thiệu</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line">{description}</p>
            </TabsContent>
            <TabsContent value="danhgia">
              <h2 className="text-lg font-semibold mb-2">Đánh giá</h2>
              <div className="text-sm opacity-80">Tính năng đánh giá sẽ hiển thị ở đây.</div>
            </TabsContent>
            <TabsContent value="comment">
              <h2 className="text-lg font-semibold mb-2">Bình luận</h2>
              <div className="text-sm opacity-80">Tính năng bình luận sẽ hiển thị ở đây.</div>
            </TabsContent>
            <TabsContent value="chuong">
              <h2 className="text-lg font-semibold mb-2">Danh sách chương</h2>
              {chapters.length > 0 ? (
                <ul className="space-y-2 text-sm max-h-64 overflow-y-auto pr-2">
                  {chapters.map((ch) => (
                    <li key={ch._id}>
                      Chương {ch.chapterNumber}: {ch.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm opacity-80">Chưa có chương nào.</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
