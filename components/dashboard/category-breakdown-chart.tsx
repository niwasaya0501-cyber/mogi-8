import { Card, CardHeader } from "@/components/ui/card";
import type { CategoryBreakdown } from "@/lib/kpi/aggregate";
import { formatCurrency, formatPercent } from "@/lib/utils";

export function CategoryBreakdownChart({ data }: { data: CategoryBreakdown[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <Card>
      <CardHeader>
        <p className="mb-3 text-sm font-semibold text-zinc-600">カテゴリ別売上</p>
        <ul className="space-y-3">
          {data.map((d) => (
            <li key={d.category}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700">{d.category}</span>
                <span className="text-zinc-500">
                  {formatCurrency(d.revenue)}（{formatPercent(d.share)}）
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-zinc-100">
                <div
                  className="h-3 rounded-full bg-brand-navy"
                  style={{ width: `${(d.revenue / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardHeader>
    </Card>
  );
}
