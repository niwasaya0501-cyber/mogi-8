import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseSalesCsv } from "@/lib/csv/parser";
import { aggregateMonthly, summarizeLatestMonth } from "@/lib/kpi/aggregate";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";

async function loadSampleSales(): Promise<File> {
  const filePath = path.join(process.cwd(), "lib/csv/__fixtures__/sales-sample.csv");
  const buffer = await readFile(filePath);
  return new File([buffer], "sales-sample.csv", { type: "text/csv" });
}

export default async function DashboardPage() {
  const file = await loadSampleSales();
  const { valid } = await parseSalesCsv(file);
  const monthly = aggregateMonthly(valid);
  const summary = summarizeLatestMonth(monthly);

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-8">
      <h1 className="text-2xl font-bold text-brand-navy">AI売上ダッシュボード</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="売上" format="currency" value={summary?.revenue.value ?? 0} momChange={summary?.revenue.momChange} />
        <KpiCard label="粗利" format="currency" value={summary?.profit.value ?? 0} momChange={summary?.profit.momChange} />
        <KpiCard label="リピート率" format="percent" value={summary?.repeatRate.value ?? 0} momChange={summary?.repeatRate.momChange} />
      </div>

      <RevenueTrendChart data={monthly.map((m) => ({ month: m.month, revenue: m.revenue }))} />
    </main>
  );
}
