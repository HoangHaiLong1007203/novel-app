"use client";

import { useState } from "react";
import { API } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { toastApiError, toNormalizedError } from "@/lib/errors";

type Props = {
  novelId: string;
  mode?: "review" | "comment";
  chapterId?: string | undefined;
  onCreated?: (item: unknown) => void;
  // If set, the composer is in reply mode and will post a reply to the given target
  replyTargetId?: string | null;
  replyTargetMode?: "review" | "comment" | null;
};

export default function RatingComment({ novelId, mode = "review", chapterId, onCreated, replyTargetId = null, replyTargetMode = null }: Props) {
  const [rating, setRating] = useState<number>(4.0);
  const [onlyScore, setOnlyScore] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");
  const [sending, setSending] = useState(false);

  const isReplying = Boolean(replyTargetId);
  const placeholder = isReplying ? "nhập để trả lời" : (mode === "review" ? "nhập nội dung đánh giá" : "nhập nội dung bình luận");

  const handleSubmit = async () => {
    if (!isReplying && mode === "comment" && content.trim().length === 0) {
      toast.error("Nội dung bình luận trống");
      return;
    }

    setSending(true);
    try {
      if (isReplying && replyTargetId) {
        // Reply flow: use appropriate reply endpoint
        if (replyTargetMode === "review") {
          const res = await API.post(`/api/reviews/${replyTargetId}/reply`, { content });
          const created = res.data?.reply || res.data;
          toast.success("Đã gửi phản hồi");
          setContent("");
          onCreated?.(created);
        } else {
          // comment reply
          const res = await API.post(`/api/comments/${replyTargetId}/reply`, { content });
          const created = res.data?.comment || res.data;
          toast.success("Đã gửi phản hồi");
          setContent("");
          onCreated?.(created);
        }
        return;
      }

      if (mode === "review") {
        const body = { novelId, rating: Math.round(rating * 10) / 10, content: onlyScore ? "" : content };
        const res = await API.post(`/api/reviews`, body);
        const created = res.data?.review || res.data;
        toast.success("Đã gửi đánh giá");
        setContent("");
        onCreated?.(created);
      } else {
        // comment mode: backend expects novelId + chapterId + content
        const body = { novelId, chapterId: typeof chapterId === 'string' ? chapterId : undefined, content };
        const res = await API.post(`/api/comments`, body);
        const created = res.data?.comment || res.data;
        toast.success("Đã gửi bình luận");
        setContent("");
        onCreated?.(created);
      }
    } catch (err) {
      console.error(toNormalizedError(err));
      const normalized = toNormalizedError(err);
      if (normalized.status === 401) {
        toastApiError(err, "Cần đăng nhập để gửi bình luận");
        return;
      }
      toastApiError(err, "Không thể gửi, vui lòng thử lại");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mb-4 p-3 rounded-xl bg-background/90">
      {mode === "review" && !isReplying && (
        <label className="block text-sm font-semibold text-foreground mb-2">
          Điểm: <span className="font-bold">{rating.toFixed(1)}</span>
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={rating}
            className="w-full mt-2 accent-amber-400"
            onChange={(e) => setRating(Number(e.target.value))}
          />
        </label>
      )}

      {mode === "review" && !isReplying && (
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 text-sm text-foreground">Tôi chỉ muốn chấm điểm (đánh giá không nội dung)</div>
          <Switch checked={onlyScore} onCheckedChange={(v) => setOnlyScore(Boolean(v))} />
        </div>
      )}

      {!onlyScore && (
        <div className="flex gap-2">
          <input
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 rounded-xl border border-amber-200/30 bg-white/5 px-3 py-2 text-foreground placeholder:opacity-60 shadow-sm focus:border-amber-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending}
            className="ml-1 inline-flex items-center justify-center rounded-md bg-amber-500 px-3 py-2 text-white disabled:opacity-50"
            aria-label="Gửi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {onlyScore && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending}
            className="inline-flex items-center justify-center rounded-md bg-amber-500 px-3 py-2 text-white disabled:opacity-50"
            aria-label="Gửi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
