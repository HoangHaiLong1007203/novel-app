"use client";

import { useState, useEffect } from "react";
import CommentOrReviewItem from "@/components/novel/CommentOrReviewItem";
import { API } from "@/lib/api";

type UserRef = { username: string; avatarUrl?: string; _id?: string };

type ReviewType = {
  _id: string;
  user: UserRef;
  rating: number;
  content: string;
  createdAt: string;
  likes?: Array<string | { _id?: string }>;
  isLikedByCurrentUser?: boolean;
  isLikedByUser?: boolean;
  repliesCount?: number;
};

type CommentType = {
  _id: string;
  user: UserRef;
  content: string;
  createdAt: string;
  likes?: Array<string | { _id?: string }>;
  repliesCount?: number;
  parentComment?: string | { _id?: string } | null;
  // backend may provide isLikedByUser
  isLikedByUser?: boolean;
  isLikedByCurrentUser?: boolean;
};

type BaseHandlers = {
  currentUserId?: string | null;
  isAdmin?: boolean;
  onReply?: (id: string) => void;
  onReport?: (id: string) => void;
  onDelete?: (id: string) => void;
  // notify parent that a child reply was deleted: (parentId, childId?)
  onChildDeleted?: (parentId: string, childId?: string) => void;
};

type ReviewProps = { id?: string; mode: "review"; items: ReviewType[] } & BaseHandlers;
type CommentProps = { id?: string; mode: "comment"; items: CommentType[] } & BaseHandlers;

type Props = (ReviewProps | CommentProps) & { novelId?: string };

type IncomingReply = { key: number; parentId: string; reply: ReplyType } | null;

type ReplyType = {
  _id: string;
  user: UserRef;
  content?: string;
  createdAt?: string;
  rating?: number;
  parentComment?: string | { _id?: string };
  likes?: Array<string | { _id?: string }>;
  isLikedByCurrentUser?: boolean;
  isLikedByUser?: boolean;
};

export default function ReviewCommentPane(props: Props & { incomingReply?: IncomingReply }) {
  const { id } = props;
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [focusedReplies, setFocusedReplies] = useState<ReplyType[]>([]);

  // If parent component passes an incoming reply, integrate it into focusedReplies
  const incoming = props.incomingReply;
  // Use effect to handle incoming reply updates
  useEffect(() => {
    if (!incoming) return;
    if (incoming.parentId && incoming.reply) {
      if (focusedId === incoming.parentId) {
        // preserve chronological order: older first, newest last
        setFocusedReplies((prev) => [...prev, incoming.reply]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming?.key]);

  // novelId not needed here

  const handleFocusToggle = async (itemId: string) => {
    if (focusedId === itemId) {
        setFocusedId(null);
        setFocusedReplies([]);
        // notify parent to clear reply target (empty string signals clear)
        props.onReply?.("");
        return;
    }
    setFocusedId(itemId);
    // notify parent (page) so the composer can switch to reply mode
    props.onReply?.(itemId);
      try {
      if (props.mode === "review") {
        const res = await API.get(`/api/reviews/${itemId}/replies`);
        setFocusedReplies(res.data?.replies || []);
      } else {
        // Build replies from props.items (avoid refetching entire comment list)
        const allComments = (props as CommentProps).items as CommentType[];
        const getParentId = (c: CommentType) => {
          if (!c.parentComment) return null;
          return typeof c.parentComment === "string" ? c.parentComment : c.parentComment._id ?? null;
        };
        const replies = allComments.filter((c) => getParentId(c) === itemId);
        setFocusedReplies(replies as ReplyType[]);
      }
    } catch (e) {
      console.error('Failed to load replies', e);
      setFocusedReplies([]);
    }
  };

  // Reply submission is handled by the global composer (RatingComment) in the page.

    if (props.mode === "review") {
    const { items, currentUserId, isAdmin, onReport, onDelete } = props as ReviewProps;
    // If focusedId is set, show only the focused item and its replies
    if (focusedId) {
      const focusedItem = items.find((it) => it._id === focusedId);
      return (
        <div id={id} className="h-96 overflow-auto rounded-lg p-2 pb-24">
          <div className="space-y-2">
            {focusedItem ? (
              <div>
                <CommentOrReviewItem
                  mode="review"
                  item={{
                    _id: focusedItem._id,
                    user: focusedItem.user,
                    content: focusedItem.content,
                    createdAt: focusedItem.createdAt,
                    rating: focusedItem.rating,
                    likes: focusedItem.likes,
                    // normalize both possible flag names
                    isLikedByCurrentUser: focusedItem.isLikedByCurrentUser ?? focusedItem.isLikedByUser,
                    isLikedByUser: focusedItem.isLikedByUser ?? focusedItem.isLikedByCurrentUser,
                    repliesCount: focusedItem.repliesCount,
                  }}
                  currentUserId={currentUserId}
                  onReply={handleFocusToggle}
                  onReport={onReport}
                  onDelete={onDelete}
                  canDelete={Boolean(isAdmin || (currentUserId && focusedItem.user?._id === currentUserId))}
                />

                <div className="ml-10 mt-1 space-y-1">
                  {/* Replies list */}
                  {focusedReplies.length > 0 ? focusedReplies.map((r: ReplyType) => (
                    <CommentOrReviewItem
                      key={r._id}
                      mode="review"
                      item={{
                        _id: r._id,
                        user: r.user,
                        content: r.content,
                        createdAt: r.createdAt,
                        rating: r.rating,
                        likes: r.likes,
                        // backend may provide either name; pass both possibilities
                        isLikedByCurrentUser: r.isLikedByCurrentUser ?? r.isLikedByUser,
                        isLikedByUser: r.isLikedByUser ?? r.isLikedByCurrentUser,
                      }}
                      currentUserId={currentUserId}
                      onDelete={(replyId: string) => {
                        onDelete?.(replyId);
                        setFocusedReplies((prev) => prev.filter((x) => x._id !== replyId));
                        props.onChildDeleted?.(focusedId as string, replyId);
                      }}
                      canDelete={Boolean(isAdmin || (currentUserId && r.user?._id === currentUserId))}
                    />
                  )) : <div className="text-sm opacity-70 ml-2">Không có phản hồi.</div>}
                </div>
              </div>
            ) : (
              <div className="text-sm opacity-80 flex items-center justify-center min-h-[6rem]">Mục được chọn không tồn tại.</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div id={id} className="h-96 overflow-auto rounded-lg p-2 pb-24">
        <div className="space-y-2">
          {items && items.length > 0 ? (
            items.map((it) => (
              <div key={it._id}>
                <CommentOrReviewItem
                  mode="review"
                  item={{
                    _id: it._id,
                    user: it.user,
                    content: it.content,
                    createdAt: it.createdAt,
                    rating: it.rating,
                    likes: it.likes,
                    isLikedByCurrentUser: it.isLikedByCurrentUser ?? it.isLikedByUser,
                    isLikedByUser: it.isLikedByUser ?? it.isLikedByCurrentUser,
                    repliesCount: it.repliesCount,
                  }}
                  currentUserId={currentUserId}
                  onReply={handleFocusToggle}
                  onReport={onReport}
                  onDelete={onDelete}
                  canDelete={Boolean(isAdmin || (currentUserId && it.user?._id === currentUserId))}
                />
              </div>
            ))
          ) : (
            <div className="text-sm opacity-80 flex items-center justify-center min-h-[6rem]">Chưa có mục nào.</div>
          )}
        </div>
      </div>
    );
  }

  // comment mode
  const { items, currentUserId, isAdmin, onReport, onDelete } = props as CommentProps;
  // Build parent->replies map and top-level list from provided items
  const repliesMap: Record<string, CommentType[]> = {};
  const topLevelComments: CommentType[] = [];
  items?.forEach((c) => {
    const parentId = c.parentComment ? (typeof c.parentComment === 'string' ? c.parentComment : c.parentComment._id) : null;
    if (parentId) {
      repliesMap[parentId] = repliesMap[parentId] || [];
      repliesMap[parentId].push(c);
    } else {
      topLevelComments.push(c);
    }
  });
  // If focusedId is set, show only focused comment and its replies + reply input
  if (focusedId) {
    const focusedItem = (items || []).find((it) => it._id === focusedId);
    return (
      <div id={id} className="h-96 overflow-auto rounded-lg p-2 pb-24">
        <div className="space-y-2">
          {focusedItem ? (
            <div>
              <CommentOrReviewItem
                mode="comment"
                item={{ _id: focusedItem._id, user: focusedItem.user, content: focusedItem.content, createdAt: focusedItem.createdAt, likes: focusedItem.likes, repliesCount: repliesMap[focusedItem._id]?.length ?? 0, isLikedByCurrentUser: focusedItem.isLikedByUser ?? focusedItem.isLikedByCurrentUser }}
                currentUserId={currentUserId}
                onReply={handleFocusToggle}
                onReport={onReport}
                onDelete={onDelete}
                canDelete={Boolean(isAdmin || (currentUserId && focusedItem.user?._id === currentUserId))}
              />

              <div className="ml-10 mt-1 space-y-1">
                {/* Replies list - use focusedReplies so incoming replies and deletes are reflected immediately */}
                { focusedReplies && focusedReplies.length > 0 ? focusedReplies.map((r) => (
                  <CommentOrReviewItem
                    key={r._id}
                    mode="comment"
                    item={{ _id: r._id, user: r.user, content: r.content, createdAt: r.createdAt, isLikedByCurrentUser: r.isLikedByUser ?? r.isLikedByCurrentUser }}
                    currentUserId={currentUserId}
                    onDelete={(replyId: string) => {
                      onDelete?.(replyId);
                      // remove locally and notify parent
                      setFocusedReplies((prev) => prev.filter((x) => x._id !== replyId));
                      props.onChildDeleted?.(focusedItem._id, replyId);
                    }}
                    canDelete={Boolean(isAdmin || (currentUserId && r.user?._id === currentUserId))}
                  />
                )) : <div className="text-sm opacity-70 ml-2">Không có phản hồi.</div>}
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-80 flex items-center justify-center min-h-[6rem]">Mục được chọn không tồn tại.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id={id} className="h-96 overflow-auto rounded-lg p-2 pb-24">
      <div className="space-y-2">
        {topLevelComments && topLevelComments.length > 0 ? (
          topLevelComments.map((it) => (
            <div key={it._id}>
              <CommentOrReviewItem
                mode="comment"
                item={{ _id: it._id, user: it.user, content: it.content, createdAt: it.createdAt, likes: it.likes, repliesCount: repliesMap[it._id]?.length ?? 0, isLikedByCurrentUser: it.isLikedByUser ?? it.isLikedByCurrentUser }}
                currentUserId={currentUserId}
                onReply={handleFocusToggle}
                onReport={onReport}
                onDelete={onDelete}
                canDelete={Boolean(isAdmin || (currentUserId && it.user?._id === currentUserId))}
              />
            </div>
          ))
        ) : (
          <div className="text-sm opacity-80 flex items-center justify-center min-h-[6rem]">Chưa có mục nào.</div>
        )}
      </div>
    </div>
  );
    }
