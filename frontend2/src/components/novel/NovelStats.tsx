import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NovelStatsProps {
  chapterCount: number;
  status: string;
  viewCount: number;
}

export default function NovelStats({ chapterCount, status, viewCount }: NovelStatsProps) {
  return (
    <Card className="mb-4 w-full">
      <CardContent className="flex justify-between items-center py-3 px-4 gap-2">
        <div className="flex flex-col items-center flex-1">
          <span className="text-lg font-bold">{chapterCount}</span>
          <span className="text-xs opacity-70">Chương</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <Badge variant="secondary" className="text-xs px-3 py-1 bg-primary/20 text-primary font-semibold">
            {status}
          </Badge>
          <span className="text-xs opacity-70 mt-1">Trạng thái</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-lg font-bold">{viewCount}</span>
          <span className="text-xs opacity-70">Lượt đọc</span>
        </div>
      </CardContent>
    </Card>
  );
}
