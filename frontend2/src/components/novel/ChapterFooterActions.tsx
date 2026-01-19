"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronsLeft,
  Book,
  Gift,
  Flag,
  Ticket,
  ChevronsRight,
} from "lucide-react";

interface Props {
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onInfo?: () => void;
  onReport?: () => void;
  onNominate?: () => void;
  onGift?: () => void;
}

export default function ChapterFooterActions({
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
  onInfo,
  onReport,
  onNominate,
  onGift,
  readerSettings,
}: Props & { readerSettings?: import("@/lib/api").ReaderSettingsPayload }) {
  return (
    <div
      className="w-full border-t"
      style={{ backgroundColor: readerSettings?.backgroundColor || "#f5efe4" }}
    >
      <div className="max-w-4xl mx-auto grid grid-cols-6 divide-x">
        {/* Chương trước */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 text-xs sm:text-sm min-h-[64px]"
          onClick={onPrev}
          disabled={!hasPrev}
        >
          <ChevronsLeft className="h-5 w-5" />
          <span className="text-center truncate w-full">Chương trước</span>
        </Button>

        {/* Thông tin */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 text-xs sm:text-sm min-h-[64px]"
          onClick={onInfo}
        >
          <Book className="h-5 w-5" />
          <span className="text-center truncate w-full">Thông tin</span>
        </Button>

        {/* Tặng quà */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 text-xs sm:text-sm min-h-[64px]"
          onClick={onGift}
        >
          <Gift className="h-5 w-5" />
          <span className="text-center truncate w-full">Tặng quà</span>
        </Button>

        {/* Báo cáo */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 text-xs sm:text-sm min-h-[64px]"
          onClick={onReport}
        >
          <Flag className="h-5 w-5" />
          <span className="text-center truncate w-full">Báo cáo</span>
        </Button>

        {/* Đề cử */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 text-xs sm:text-sm min-h-[64px]"
          onClick={onNominate}
        >
          <Ticket className="h-5 w-5" />
          <span className="text-center truncate w-full">Đề cử</span>
        </Button>

        {/* Chương sau */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center gap-1 py-3 px-2 text-xs sm:text-sm min-h-[64px]"
          onClick={onNext}
          disabled={!hasNext}
        >
          <ChevronsRight className="h-5 w-5" />
          <span className="text-center truncate w-full">Chương sau</span>
        </Button>
      </div>
    </div>
  );
}
