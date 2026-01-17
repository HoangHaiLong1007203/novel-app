import CommentOrReviewItem from "@/components/novel/CommentOrReviewItem";

interface ReviewItemProps {
  review: {
    _id: string;
    user: { username: string; avatarUrl?: string; _id?: string };
    rating: number;
    content: string;
    createdAt: string;
  };
  currentUserId?: string | null;
  onReply?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
}

export default function ReviewItem({ review, currentUserId, onReply, onReport, onDelete }: ReviewItemProps) {
  return (
    <CommentOrReviewItem
      mode="review"
      item={{
        _id: review._id,
        user: review.user,
        content: review.content,
        createdAt: review.createdAt,
        rating: review.rating,
      }}
      currentUserId={currentUserId}
      onReply={onReply}
      onReport={onReport}
      onDelete={onDelete}
    />
  );
}
