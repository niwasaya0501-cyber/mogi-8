import { Card, CardHeader } from "@/components/ui/card";
import type { InventoryRisk, InventoryTurnoverRow } from "@/lib/kpi/aggregate";
import { cn } from "@/lib/utils";

const RISK_LABEL: Record<InventoryRisk, { text: string; icon: string; className: string }> = {
  stockout: { text: "欠品リスク", icon: "⚠", className: "bg-red-50 text-red-700" },
  excess: { text: "過剰在庫", icon: "📦", className: "bg-amber-50 text-amber-700" },
  normal: { text: "適正", icon: "✓", className: "bg-emerald-50 text-emerald-700" },
};

export function InventoryTurnoverTable({ data }: { data: InventoryTurnoverRow[] }) {
  return (
    <Card className="overflow-x-auto">
      <CardHeader>
        <p className="mb-3 text-sm font-semibold text-zinc-600">在庫回転率</p>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 pr-2 font-medium">商品名</th>
              <th className="py-2 pr-2 font-medium">SKU</th>
              <th className="py-2 pr-2 text-right font-medium">在庫数</th>
              <th className="py-2 pr-2 text-right font-medium">販売数</th>
              <th className="py-2 pr-2 text-right font-medium">回転率</th>
              <th className="py-2 font-medium">状態</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const risk = RISK_LABEL[item.risk];
              return (
                <tr key={item.sku} className="border-b border-zinc-100 last:border-0">
                  <td className="py-2 pr-2 text-zinc-800">{item.productName}</td>
                  <td className="py-2 pr-2 text-zinc-500">{item.sku}</td>
                  <td className="py-2 pr-2 text-right text-zinc-800">{item.stockQuantity}</td>
                  <td className="py-2 pr-2 text-right text-zinc-800">{item.soldQuantity}</td>
                  <td className="py-2 pr-2 text-right text-zinc-800">{item.turnoverRate.toFixed(2)}</td>
                  <td className="py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                        risk.className,
                      )}
                    >
                      <span aria-hidden="true">{risk.icon}</span>
                      {risk.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardHeader>
    </Card>
  );
}
