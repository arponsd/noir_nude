import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export interface SalesChartBucket {
  /** Short x-axis label (e.g. "Mon", "Apr 10"). */
  label: string;
  /** Revenue in paisa for this bucket. */
  revenue: number;
  /** Order count — displayed as tooltip/below bar. */
  orders?: number;
}

export interface SalesChartProps {
  buckets: SalesChartBucket[];
  className?: string;
  /** Optional chart title used for aria-label. */
  title?: string;
}

/**
 * Responsive SVG bar chart for weekly/daily sales. Server component.
 * Uses viewBox + preserveAspectRatio for fluid width; paints bars with the accent color
 * at 85% opacity. Axis labels are rendered in SVG text for zero-CSS-dependency rendering.
 */
export default function SalesChart({
  buckets,
  className,
  title = "Sales by day",
}: SalesChartProps) {
  const width = 640;
  const height = 220;
  const padX = 32;
  const padTop = 16;
  const padBottom = 28;

  const max = buckets.reduce((acc, b) => Math.max(acc, b.revenue), 0) || 1;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const slot = buckets.length > 0 ? innerW / buckets.length : innerW;
  const barW = Math.max(4, slot * 0.55);

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-4",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-[220px] w-full"
        role="img"
        aria-label={title}
      >
        {/* baseline */}
        <line
          x1={padX}
          y1={height - padBottom}
          x2={width - padX}
          y2={height - padBottom}
          stroke="var(--line)"
          strokeWidth={1}
        />
        {buckets.map((b, i) => {
          const barH = (b.revenue / max) * innerH;
          const x = padX + i * slot + (slot - barW) / 2;
          const y = height - padBottom - barH;
          return (
            <g key={`${b.label}-${i}`}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(1, barH)}
                rx={3}
                fill="var(--accent)"
                fillOpacity={0.85}
              >
                <title>
                  {b.label}: {formatBDT(b.revenue)}
                  {b.orders !== undefined ? ` (${b.orders} orders)` : ""}
                </title>
              </rect>
              <text
                x={x + barW / 2}
                y={height - padBottom + 16}
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted)"
              >
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
