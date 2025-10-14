"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChapterRangeSelect from "@/components/ui/ChapterRangeSelect";
import { GENRES } from "@/lib/genres"; // 🔹 import danh sách thể loại

interface FilterState {
  categories: string[];
  genres: string[];
  status: string[];
  chapterRange: [number, number];
  sortBy: string | null;
}

interface NovelFilterProps {
  layout: "vertical" | "horizontal";
  onFilterChange?: (filter: FilterState) => void;
}

const chapterMarks = [0, 100, 200, 300, 400, 500, 750, 1000, 1500, 2000];

export default function NovelFilter({ layout, onFilterChange }: NovelFilterProps) {
  const [filter, setFilter] = useState<FilterState>({
    categories: [],
    genres: [],
    status: [],
    chapterRange: [0, 2100],
    sortBy: null,
  });
  const [tempFilter, setTempFilter] = useState(filter);
  const [range, setRange] = useState<[number, number]>([0, 2100]); // 2100 internal = 2000+
  // 📏 làm tròn về mốc gần nhất
  const snapToNearestMark = (value: number): number => {
    let nearest = chapterMarks[0];
    let minDiff = Math.abs(value - nearest);
    for (const mark of chapterMarks) {
      const diff = Math.abs(value - mark);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = mark;
      }
    }
    return nearest;
  };

  const handleRangeChange = (val: number[]) => setRange(val as [number, number]);

  const handleRangeCommit = (val: number[]) => {
    const snapped: [number, number] = [snapToNearestMark(val[0]), snapToNearestMark(val[1])];
    setRange(snapped);
    setTempFilter({ ...tempFilter, chapterRange: snapped });
  };

  const toggleItem = (key: keyof FilterState, value: string) => {
    if (!Array.isArray(tempFilter[key])) return;
    const arr = tempFilter[key] as string[];
    const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    setTempFilter({ ...tempFilter, [key]: newArr });
  };

  const selectSort = (value: string) => setTempFilter({ ...tempFilter, sortBy: value });

  const resetFilter = () => {
    const reset = {
      categories: [],
      genres: [],
      status: [],
      chapterRange: [0, 2000] as [number, number],
      sortBy: null,
    };
    setFilter(reset);
    setTempFilter(reset);
    setRange([0, 2000]);
    onFilterChange?.(reset);
  };

  const applyFilter = () => {
    setFilter(tempFilter);
    onFilterChange?.(tempFilter);
  };

  const FilterContent = () => (
    <ScrollArea className="max-h-[85vh]">
      <div className="space-y-6">
        {/* loại */}
        <div>
          <h3 className="font-semibold mb-2">Loại</h3>
          <div className="flex flex-wrap gap-2">
            {["sáng tác", "dịch/đăng lại"].map((c) => (
              <Badge
                key={c}
                className={`cursor-pointer px-3 py-1 ${
                  tempFilter.categories.includes(c)
                    ? "bg-primary text-white"
                    : "bg-secondary text-foreground"
                }`}
                onClick={() => toggleItem("categories", c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>

        {/* thể loại */}
        <div>
          <h3 className="font-semibold mb-2">Thể loại</h3>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
            {GENRES.map((g) => (
              <Badge
                key={g}
                className={`cursor-pointer px-3 py-1 ${
                  tempFilter.genres.includes(g)
                    ? "bg-primary text-white"
                    : "bg-secondary text-foreground"
                }`}
                onClick={() => toggleItem("genres", g)}
              >
                {g}
              </Badge>
            ))}
          </div>
        </div>

        {/* trạng thái */}
        <div>
          <h3 className="font-semibold mb-2">Trạng thái</h3>
          <div className="flex flex-wrap gap-2">
            {["còn tiếp", "tạm ngưng", "hoàn thành"].map((s) => (
              <Badge
                key={s}
                className={`cursor-pointer px-3 py-1 ${
                  tempFilter.status.includes(s)
                    ? "bg-primary text-white"
                    : "bg-secondary text-foreground"
                }`}
                onClick={() => toggleItem("status", s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Số chương */}
        <div>
          <h3 className="font-semibold mb-2">Số chương</h3>
          <div className="overflow-visible w-full px-1">
            <ChapterRangeSelect
              value={tempFilter.chapterRange}
              onChange={(range) => setTempFilter({ ...tempFilter, chapterRange: range })}
            />
          </div>
        </div>

        {/* sắp xếp theo */}
        <div>
          <h3 className="font-semibold mb-2">Sắp xếp theo</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "none", label: "Mặc định" },
              { value: "latest", label: "Mới nhất" },
              { value: "oldest", label: "Cũ nhất" },
              { value: "mostChapters", label: "Nhiều chương nhất" },
              { value: "leastChapters", label: "Ít chương nhất" },
            ].map((s) => (
              <Badge
                key={s.value}
                className={`cursor-pointer px-3 py-1 ${
                  tempFilter.sortBy === s.value
                    ? "bg-primary text-white"
                    : "bg-secondary text-foreground"
                }`}
                onClick={() => selectSort(s.value)}
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* nút hành động */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={resetFilter}>
            Đặt lại
          </Button>
          <Button onClick={applyFilter}>Lọc</Button>
        </div>
      </div>
    </ScrollArea>
  );

  return (
    <div className="w-full border rounded-lg p-4 bg-background shadow-sm transition-all duration-300">
      <FilterContent />
    </div>
  );
}
