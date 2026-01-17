"use client";

interface TrendSparklineProps {
  data: number[];
  stroke?: string;
  className?: string;
}

const WIDTH = 140;
const HEIGHT = 48;

export default function TrendSparkline({ data, stroke = "hsl(var(--primary))", className }: TrendSparklineProps) {
  if (!data.length) {
    return <div className={className} />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / Math.max(1, data.length - 1)) * WIDTH;
    const y = HEIGHT - ((value - min) / range) * HEIGHT;
    return { x, y };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  return (
    <svg
      className={className}
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Biểu đồ xu hướng"
    >
      <defs>
        <linearGradient id="sparkline-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={`${path} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`}
        fill="url(#sparkline-fill)"
        stroke="transparent"
      />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
