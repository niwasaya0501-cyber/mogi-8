import { Card, CardHeader } from "@/components/ui/card";
import type { SkuRanking } from "@/lib/kpi/aggregate";
import { formatCurrency } from "@/lib/utils";

export function SkuRankingTable({ data }: { data: SkuRanking[] }) {
  return (
    <Card className="overflow-x-auto">
      <CardHeader>
        <p className="mb-3 text-sm font-semibold text-zinc-600">SKUトップ10（売上順）</p>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 pr-2 font-medium">順位</th>
              <th className="py-2 pr-2 font-medium">商品名</th>
              <th className="py-2 pr-2 font-medium">SKU</th>
              <th className="py-2 pr-2 text-right font-medium">数量</th>
              <th className="py-2 text-right font-medium">売上</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={item.sku} className="border-b border-zinc-100 last:border-0">
                <td className="py-2 pr-2 text-zinc-500">{i + 1}</td>
                <td className="py-2 pr-2 text-zinc-800">{item.productName}</td>
                <td className="py-2 pr-2 text-zinc-500">{item.sku}</td>
                <td className="py-2 pr-2 text-right text-zinc-800">{item.quantity}</td>
                <td className="py-2 text-right font-medium text-zinc-800">{formatCurrency(item.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardHeader>
    </Card>
  );
}
