import type { SaleRow } from "@/lib/csv/schema";

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
