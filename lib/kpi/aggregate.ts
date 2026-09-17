import type { InventoryRow, SaleRow } from "@/lib/csv/schema";

export type MonthlyKpi = {
  monthKey: string; // "2025-09"
  month: string; // "9月" (chart label)
  revenue: number;
  profit: number;
  repeatRate: number; // 0-100
};

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toMonthLabel(monthKey: string): string {
  const [, month] = monthKey.split("-");
  return `${Number(month)}月`;
}

export function aggregateMonthly(sales: SaleRow[]): MonthlyKpi[] {
  const sorted = [...sales].sort((a, b) => a.order_date.getTime() - b.order_date.getTime());

  const byMonth = new Map<string, SaleRow[]>();
  for (const sale of sorted) {
    const key = toMonthKey(sale.order_date);
    const bucket = byMonth.get(key) ?? [];
    bucket.push(sale);
    byMonth.set(key, bucket);
  }

  const seenCustomers = new Set<string>();
  const result: MonthlyKpi[] = [];

  for (const [monthKey, rows] of [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const revenue = rows.reduce((sum, r) => sum + r.revenue, 0);
    const profit = rows.reduce((sum, r) => sum + (r.revenue - r.cost), 0);

    const repeatOrders = rows.filter((r) => seenCustomers.has(r.customer_id)).length;
    const repeatRate = rows.length === 0 ? 0 : (repeatOrders / rows.length) * 100;

    result.push({ monthKey, month: toMonthLabel(monthKey), revenue, profit, repeatRate });

    for (const r of rows) seenCustomers.add(r.customer_id);
  }

  return result;
}

export type KpiSummary = {
  revenue: { value: number; momChange?: number };
  profit: { value: number; momChange?: number };
  repeatRate: { value: number; momChange?: number };
};

function momChange(current: number, previous: number | undefined): number | undefined {
  if (previous === undefined || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

export function summarizeLatestMonth(monthly: MonthlyKpi[]): KpiSummary | undefined {
  if (monthly.length === 0) return undefined;
  const current = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];

  return {
    revenue: { value: current.revenue, momChange: momChange(current.revenue, previous?.revenue) },
    profit: { value: current.profit, momChange: momChange(current.profit, previous?.profit) },
    repeatRate: { value: current.repeatRate, momChange: momChange(current.repeatRate, previous?.repeatRate) },
  };
}

export type CategoryBreakdown = {
  category: string;
  revenue: number;
  profit: number;
  share: number; // 売上構成比（0-100）
};

const UNCATEGORIZED_LABEL = "未分類";

export function aggregateCategoryBreakdown(sales: SaleRow[]): CategoryBreakdown[] {
  const totalRevenue = sales.reduce((sum, r) => sum + r.revenue, 0);

  const byCategory = new Map<string, { revenue: number; profit: number }>();
  for (const r of sales) {
    const key = r.category?.trim() || UNCATEGORIZED_LABEL;
    const bucket = byCategory.get(key) ?? { revenue: 0, profit: 0 };
    bucket.revenue += r.revenue;
    bucket.profit += r.revenue - r.cost;
    byCategory.set(key, bucket);
  }

  return [...byCategory.entries()]
    .map(([category, v]) => ({
      category,
      revenue: v.revenue,
      profit: v.profit,
      share: totalRevenue === 0 ? 0 : (v.revenue / totalRevenue) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export type SkuRanking = {
  sku: string;
  productName: string;
  quantity: number;
  revenue: number;
};

export function aggregateSkuRanking(sales: SaleRow[], limit = 10): SkuRanking[] {
  const bySku = new Map<string, SkuRanking>();
  for (const r of sales) {
    const bucket = bySku.get(r.sku) ?? { sku: r.sku, productName: r.product_name, quantity: 0, revenue: 0 };
    bucket.quantity += r.quantity;
    bucket.revenue += r.revenue;
    bySku.set(r.sku, bucket);
  }

  return [...bySku.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export type InventoryRisk = "stockout" | "excess" | "normal";

export type InventoryTurnoverRow = {
  sku: string;
  productName: string;
  stockQuantity: number;
  soldQuantity: number;
  turnoverRate: number; // 期間内販売数 ÷ 現在庫数
  risk: InventoryRisk;
};

// 回転率が高いほど売れ行きが早く欠品リスク、低いほど売れ残り＝過剰在庫リスクと判定する簡易しきい値。
// 発注リードタイム等は考慮しないMVP版の目安であり、実運用ではクライアントごとに調整が必要。
const STOCKOUT_RISK_THRESHOLD = 1.0;
const EXCESS_STOCK_THRESHOLD = 0.3;

function judgeInventoryRisk(turnoverRate: number): InventoryRisk {
  if (turnoverRate >= STOCKOUT_RISK_THRESHOLD) return "stockout";
  if (turnoverRate < EXCESS_STOCK_THRESHOLD) return "excess";
  return "normal";
}

export function aggregateInventoryTurnover(sales: SaleRow[], inventory: InventoryRow[]): InventoryTurnoverRow[] {
  const soldBySku = new Map<string, number>();
  for (const r of sales) {
    soldBySku.set(r.sku, (soldBySku.get(r.sku) ?? 0) + r.quantity);
  }

  return inventory
    .map((item) => {
      const soldQuantity = soldBySku.get(item.sku) ?? 0;
      const turnoverRate = item.stock_quantity === 0 ? 0 : soldQuantity / item.stock_quantity;
      return {
        sku: item.sku,
        productName: item.product_name,
        stockQuantity: item.stock_quantity,
        soldQuantity,
        turnoverRate,
        risk: judgeInventoryRisk(turnoverRate),
      };
    })
    .sort((a, b) => b.turnoverRate - a.turnoverRate);
}
