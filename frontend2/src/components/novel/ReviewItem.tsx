import { FaStar } from "react-icons/fa";
import CommentItem from "@/components/novel/CommentItem";

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
    <div className="mb-4">
      <div className="flex items-center gap-1 mb-1">
        {[...Array(5)].map((_, i) => (
          <FaStar key={i} className={
            i < review.rating ? "text-yellow-400" : "text-gray-400"
          } />
        ))}
        <span className="ml-2 text-sm font-semibold text-yellow-400">{review.rating}/5</span>
      </div>
      <CommentItem
        comment={{
          _id: review._id,
          user: review.user,
          content: review.content,
          createdAt: review.createdAt,
        }}
        currentUserId={currentUserId}
        onReply={onReply}
        onReport={onReport}
        onDelete={onDelete}
      />
    </div>
  );
}
