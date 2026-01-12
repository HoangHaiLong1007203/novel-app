import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FaFlag, FaTrash } from "react-icons/fa";

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
  const isOwn = currentUserId && comment.user && comment.user._id === currentUserId;
  return (
    <Card className="mb-2 bg-background/80">
      <CardContent className="flex gap-3 items-start py-4 px-2">
        <Avatar className="w-8 h-8">
          {comment.user.avatarUrl ? (
            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.username} />
          ) : null}
          <AvatarFallback>{comment.user.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{comment.user.username}</span>
            <span className="text-xs opacity-60 ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          <div className="text-sm whitespace-pre-line mt-1 mb-2">{comment.content}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="px-2 py-1 text-xs" onClick={() => onReply?.(comment._id)}>
              Trả lời
            </Button>
            <Button size="sm" variant="ghost" className="px-2 py-1 text-xs text-red-500" onClick={() => onReport?.(comment._id)}>
              <FaFlag className="inline-block mr-1" /> Báo cáo
            </Button>
            {isOwn && (
              <Button size="sm" variant="ghost" className="px-2 py-1 text-xs text-red-600" onClick={() => onDelete?.(comment._id)}>
                <FaTrash className="inline-block mr-1" /> Xóa
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
