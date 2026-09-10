import { buildLineChartGeometry } from "@/lib/chart/lineChartGeometry";

export type MonthlyPoint = { month: string; revenue: number };

const WIDTH = 900;
const HEIGHT = 260;
const BRAND_NAVY = "#1A2E5C";

export function RevenueTrendChart({ data }: { data: MonthlyPoint[] }) {
  const geometry = buildLineChartGeometry(
    data.map((d) => ({ label: d.month, value: d.revenue })),
    { width: WIDTH, height: HEIGHT }
  );

  const linePath = geometry.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="月次売上推移グラフ">
        {geometry.yTicks.map((tick) => (
          <g key={tick.value}>
            <line x1={56} x2={WIDTH - 16} y1={tick.y} y2={tick.y} stroke="#e4e4e7" strokeDasharray="3 3" />
            <text x={48} y={tick.y + 4} fontSize={11} textAnchor="end" fill="#71717a">
              ¥{Math.round(tick.value).toLocaleString()}
            </text>
          </g>
        ))}

        {geometry.xLabels.map((label) => (
          <text key={label.label} x={label.x} y={HEIGHT - 8} fontSize={12} textAnchor="middle" fill="#71717a">
            {label.label}
          </text>
        ))}

        <path d={linePath} fill="none" stroke={BRAND_NAVY} strokeWidth={2} />

        {geometry.points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={BRAND_NAVY}>
            <title>
              {data[i].month}: ¥{data[i].revenue.toLocaleString()}
            </title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
