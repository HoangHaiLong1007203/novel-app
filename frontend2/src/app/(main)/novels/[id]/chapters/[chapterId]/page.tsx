"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API } from "@/lib/api";

interface Chapter {
  _id: string;
  chapterNumber: number;
  title: string;
  content: string;
  novel: {
    _id: string;
    title: string;
  };
}

export default function ChapterPage() {
  const { id, chapterId } = useParams();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chapterId) return;
    const fetchData = async () => {
      try {
        const res = await API.get(`/api/novels/${id}/chapters/${chapterId}`);
        setChapter(res.data?.chapter || null);
      } catch (err) {
        console.error("Không thể tải chương:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, chapterId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Đang tải chương...</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Không tìm thấy chương.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        Chương {chapter.chapterNumber}: {chapter.title}
      </h1>
      <div className="prose prose-lg max-w-none">
        <pre className="whitespace-pre-wrap">{chapter.content}</pre>
      </div>
    </div>
  );
}
