"use client";

import CommentItem from "@/components/novel/CommentItem";
import ReviewItem from "@/components/novel/ReviewItem";

type UserRef = { username: string; avatarUrl?: string; _id?: string };

type ReviewType = {
  _id: string;
  user: UserRef;
  rating: number;
  content: string;
  createdAt: string;
};

type CommentType = {
  _id: string;
  user: UserRef;
  content: string;
  createdAt: string;
};

type BaseHandlers = {
  currentUserId?: string | null;
  onReply?: (id: string) => void;
  onReport?: (id: string) => void;
  onDelete?: (id: string) => void;
};

type ReviewProps = { id?: string; mode: "review"; items: ReviewType[] } & BaseHandlers;
type CommentProps = { id?: string; mode: "comment"; items: CommentType[] } & BaseHandlers;

type Props = ReviewProps | CommentProps;

export default function ReviewCommentPane(props: Props) {
  const { id } = props;

  if (props.mode === "review") {
    const { items, currentUserId, onReply, onReport, onDelete } = props as ReviewProps;
    return (
      <div id={id} className="h-96 overflow-auto rounded-lg p-2">
        <div className="space-y-2">
          {items && items.length > 0 ? (
            items.map((it) => (
              <ReviewItem
                key={it._id}
                review={it}
                currentUserId={currentUserId}
                onReply={onReply}
                onReport={onReport}
                onDelete={onDelete}
              />
            ))
          ) : (
            <div className="text-sm opacity-80 flex items-center justify-center min-h-[6rem]">Chưa có mục nào.</div>
          )}
        </div>
      </div>
    );
  }

  // comment mode
  const { items, currentUserId, onReply, onReport, onDelete } = props as CommentProps;
  return (
    <div id={id} className="h-96 overflow-auto rounded-lg p-2">
      <div className="space-y-2">
        {items && items.length > 0 ? (
          items.map((it) => (
            <CommentItem
              key={it._id}
              comment={it}
              currentUserId={currentUserId}
              onReply={onReply}
              onReport={onReport}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="text-sm opacity-80 flex items-center justify-center min-h-[6rem]">Chưa có mục nào.</div>
        )}
          </div>
        </div>
      );
    }
