"use client";


import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FaFlag, FaTrash, FaStar, FaRegHeart, FaHeart, FaComment } from "react-icons/fa";
import { API } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";

type UserRef = { username: string; avatarUrl?: string; _id?: string };

type Props = {
  mode: "review" | "comment";
  item: {
    _id: string;
    user: UserRef;
    content?: string;
    createdAt?: string;
    rating?: number | null;
    // likes may be an array of user ids or populated user refs
    likes?: Array<string | { _id?: string }>;
    // sometimes backend returns a likesCount instead of full array
    likesCount?: number;
    isLikedByCurrentUser?: boolean;
    // some endpoints use this alternate name
    isLikedByUser?: boolean;
    repliesCount?: number;
    replies?: Array<{ _id: string }>;
  };
  currentUserId?: string | null;
  onReply?: (id: string) => void;
  onReport?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
};

export default function CommentOrReviewItem({ mode, item, currentUserId, onReply, onReport, onDelete, canDelete }: Props) {
  const initialLikes = Array.isArray(item.likes) ? item.likes.length : item.likesCount ?? 0;
  const initialIsLiked = Boolean(
    item.isLikedByCurrentUser ??
    item.isLikedByUser ??
    (currentUserId && Array.isArray(item.likes) && item.likes.some((l) => (typeof l === "string" ? l === currentUserId : (l && l._id) === currentUserId)))
  );
  const initialReplies = item.repliesCount ?? item.replies?.length ?? 0;
  const [likesCount, setLikesCount] = useState<number>(initialLikes);
  const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);
  const [repliesCount] = useState<number>(initialReplies);
  const [isLiking, setIsLiking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const shouldShowToggle = Boolean(item.content) && (((item.content || "").match(/\n/g) || []).length >= 3 || (item.content || "").length > 300);

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để like");
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    try {
      let res;
      if (mode === "review") {
        res = await API.post(`/api/reviews/${item._id}/like`);
      } else {
        res = await API.post(`/api/comments/${item._id}/like`);
      }
      const data = res?.data || {};
      // Prefer server-provided counts/status when available
      if (typeof data.likesCount === "number") {
        setLikesCount(data.likesCount);
      } else if (typeof data.likes === "number") {
        setLikesCount(data.likes);
      }
      if (typeof data.isLiked === "boolean") {
        setIsLiked(data.isLiked);
      } else {
        // fallback: toggle
        setIsLiked((prev) => {
          const next = !prev;
          setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
          return next;
        });
      }
    } catch (e) {
      console.error("Like action failed", e);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    onDelete?.(item._id);
  };

  const handleToggleReplies = async () => {
    // reuse onReply prop as a toggle/focus handler for showing replies
    onReply?.(item._id);
  };

  // Keep likes and liked state in sync when item or currentUserId changes
  useEffect(() => {
    const newLikes = Array.isArray(item.likes) ? item.likes.length : item.likesCount ?? 0;
    setLikesCount(newLikes);
    const newIsLiked = Boolean(
      item.isLikedByCurrentUser ??
      item.isLikedByUser ??
      (currentUserId && Array.isArray(item.likes) && item.likes.some((l) => (typeof l === "string" ? l === currentUserId : (l && l._id) === currentUserId)))
    );
    setIsLiked(newIsLiked);
  }, [item, currentUserId]);

  return (
    <Card id={`report-target-${item._id}`} className="mb-2 bg-background/80 relative">
      <CardContent className="flex flex-col gap-3 py-4 px-2">

        {/* Top-right actions: report + delete */}
        <div className="absolute top-2 right-2 flex gap-2">
          {onReport ? (
            <button className="text-sm text-red-400" onClick={() => onReport?.(item._id)} aria-label="Báo cáo">
              <FaFlag />
            </button>
          ) : null}
          {canDelete ? (
            <button className="text-sm text-red-600" onClick={handleDelete} aria-label="Xóa">
              <FaTrash />
            </button>
          ) : null}
        </div>

        <div className="flex gap-3 items-start">
          <Avatar className="w-8 h-8 mt-1">
            {item.user.avatarUrl ? (
              <AvatarImage src={item.user.avatarUrl} alt={item.user.username} />
            ) : null}
            <AvatarFallback>{item.user.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* If review mode, show rating above username so it's aligned with username below */}
            {mode === "review" && typeof item.rating === "number" && (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={i < (item.rating ?? 0) ? "text-yellow-400" : "text-gray-400"} />
                ))}
                <span className="ml-2 text-sm font-semibold text-yellow-400">{(item.rating ?? 0)}/5</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{item.user.username}</span>
              <span className="text-xs opacity-60 ml-2">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</span>
            </div>

            <div className="text-sm mt-1 mb-2">
              {!expanded ? (
                <div
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {item.content}
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-line' }}>{item.content}</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              {shouldShowToggle && (
                <button className="text-sm text-foreground/80 mr-2" onClick={() => setExpanded((s) => !s)}>
                  {expanded ? "Thu gọn" : "Xem thêm"}
                </button>
              )}
              <button className="flex items-center gap-2 text-sm text-foreground/90" onClick={handleLike} aria-label="Like">
                {isLiked ? <FaHeart className="text-red-400" /> : <FaRegHeart />} <span className="text-xs">{likesCount}</span>
              </button>
              <button className="flex items-center gap-2 text-sm text-foreground/90" onClick={handleToggleReplies} aria-label="Replies">
                <FaComment /> <span className="text-xs">{repliesCount}</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
