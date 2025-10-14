"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui";

interface PaginationCompactProps {
  page: number;
  totalPages: number;
  onChange: (newPage: number) => void;
  className?: string;
}

export default function PaginationCompact({
  page,
  totalPages,
  onChange,
  className = "",
}: PaginationCompactProps) {
  // ✅ luôn hiển thị kể cả khi chỉ có 1 trang
  const safeTotal = Math.max(totalPages || 1, 1);
  const visiblePages = Math.min(5, safeTotal);
  const startPage = Math.max(1, Math.min(page - 2, safeTotal - visiblePages + 1));

  return (
    <div className={`flex justify-center ${className}`}>
      <Pagination>
        <PaginationContent className="flex items-center gap-1">
          {/* prev */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => page > 1 && onChange(page - 1)}
              className={`cursor-pointer ${
                page === 1 ? "pointer-events-none opacity-40" : ""
              }`}
            />
          </PaginationItem>

          {/* số trang */}
          {Array.from({ length: visiblePages }, (_, i) => {
            const p = startPage + i;
            return (
              <PaginationItem key={p}>
                <PaginationLink
                  onClick={() => onChange(p)}
                  className={`cursor-pointer ${
                    p === page ? "bg-primary text-white hover:bg-primary/90" : ""
                  }`}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {/* ellipsis nếu còn trang */}
          {safeTotal > visiblePages && page < safeTotal - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {/* next */}
          <PaginationItem>
            <PaginationNext
              onClick={() => page < safeTotal && onChange(page + 1)}
              className={`cursor-pointer ${
                page === safeTotal ? "pointer-events-none opacity-40" : ""
              }`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
