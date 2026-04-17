import { cn } from "@/lib/utils/cn";

export interface MiniChartPoint {
  x: string;
  y: number;
}

export interface MiniChartProps {
  data: MiniChartPoint[];
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Pure SVG sparkline. Server component — no external charting lib.
 * Renders a smooth polyline of `y` values across a fixed viewBox, with an area fill
 * under the line. Empty data renders a subtle placeholder baseline.
 */
export default function MiniChart({
  data,
  width = 160,
  height = 48,
  className,
  ariaLabel = "Trend sparkline",
}: MiniChartProps) {
  if (data.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className={cn("block text-[var(--muted)]", className)}
        role="img"
        aria-label={ariaLabel}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeDasharray="2 4"
          strokeWidth={1}
        />
      </svg>
    );
  }

  const ys = data.map((d) => d.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const range = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : i * step;
    const y = height - ((d.y - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L${width} ${height} L0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("block text-[var(--accent)]", className)}
      role="img"
      aria-label={ariaLabel}
    >
      <path d={areaPath} fill="currentColor" fillOpacity={0.08} />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
