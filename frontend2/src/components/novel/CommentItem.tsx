import CommentOrReviewItem from "@/components/novel/CommentOrReviewItem";

interface CommentItemProps {
  comment: {
    _id: string;
    user: { username: string; avatarUrl?: string; _id?: string };
    content: string;
    createdAt: string;
  };
  currentUserId?: string | null;
  onReply?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
}

export default function CommentItem({ comment, currentUserId, onReply, onReport, onDelete }: CommentItemProps) {
  return (
    <CommentOrReviewItem
      mode="comment"
      item={{
        _id: comment._id,
        user: comment.user,
        content: comment.content,
        createdAt: comment.createdAt,
        rating: null,
      }}
      currentUserId={currentUserId}
      onReply={onReply}
      onReport={onReport}
      onDelete={onDelete}
    />
  );
}
