"use client";

import { useState, useEffect, useMemo } from "react";

export type ChapterRange = [number, number]; // 2100 = 2000+

interface ChapterRangeSelectProps {
  value?: ChapterRange;
  onChange?: (v: ChapterRange) => void;
  className?: string;
}

const DEFAULT_MARKS = [0, 100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 2100];
const displayLabel = (v: number) => (v >= 2100 ? "2000+" : v);

export default function ChapterRangeSelect({
  value,
  onChange,
  className = "",
}: ChapterRangeSelectProps) {
  const marks = useMemo(() => DEFAULT_MARKS, []);
  const [min, setMin] = useState(value?.[0] ?? 0);
  const [max, setMax] = useState(value?.[1] ?? 2100); // ✅ mặc định 2000+

  useEffect(() => {
    if (value) {
      setMin(value[0] ?? 0);
      setMax(value[1] ?? 2100);
    }
  }, [value]);

  const handleMin = (v: number) => {
    const safeMax = max ?? 2100;
    const newMin = v ?? 0;
    const correctedMax = newMin > safeMax ? newMin : safeMax;
    setMin(newMin);
    setMax(correctedMax);
    onChange?.([newMin, correctedMax]);
  };

  const handleMax = (v: number) => {
    const safeMin = min ?? 0;
    const newMax = v ?? 2100;
    const correctedMin = newMax < safeMin ? newMax : safeMin;
    setMax(newMax);
    setMin(correctedMin);
    onChange?.([correctedMin, newMax]);
  };

  const minOptions = marks.filter((m) => m <= (max ?? 2100));
  const maxOptions = marks.filter((m) => m >= (min ?? 0));

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      <div className="flex gap-4">
        {/* MIN */}
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">Từ (Min)</label>
          <select
            value={min}
            onChange={(e) => handleMin(Number(e.target.value))}
            className="w-full border rounded px-2 py-1 bg-background"
          >
            {minOptions.map((m) => (
              <option key={m} value={m}>
                {displayLabel(m)}
              </option>
            ))}
          </select>
        </div>

        {/* MAX */}
        <div className="flex-1">
          <label className="block text-xs text-muted-foreground mb-1">Đến (Max)</label>
          <select
            value={max}
            onChange={(e) => handleMax(Number(e.target.value))}
            className="w-full border rounded px-2 py-1 bg-background"
          >
            {maxOptions.map((m) => (
              <option key={m} value={m}>
                {displayLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {`Khoảng: ${displayLabel(min)} – ${displayLabel(max)} chương`}
      </div>
    </div>
  );
}
