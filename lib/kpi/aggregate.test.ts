import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseSalesCsv } from "@/lib/csv/parser";
import { aggregateMonthly, summarizeLatestMonth } from "./aggregate";

async function loadSalesFixture(): Promise<File> {
  const filePath = path.join(import.meta.dirname, "../csv/__fixtures__/sales-sample.csv");
  const buffer = await readFile(filePath);
  return new File([buffer], "sales-sample.csv", { type: "text/csv" });
}

describe("aggregateMonthly", () => {
  it("sums revenue/profit per month and computes cumulative repeat rate", async () => {
    const file = await loadSalesFixture();
    const { valid } = await parseSalesCsv(file);
    const monthly = aggregateMonthly(valid);

    expect(monthly.map((m) => m.monthKey)).toEqual(["2025-09", "2025-10", "2025-11"]);

    expect(monthly[0]).toMatchObject({ month: "9月", revenue: 148400, profit: 93400, repeatRate: 0 });
    expect(monthly[1].revenue).toBe(147500);
    expect(monthly[1].profit).toBe(92600);
    expect(monthly[1].repeatRate).toBeCloseTo((5 / 13) * 100, 5);

    expect(monthly[2].revenue).toBe(264700);
    expect(monthly[2].profit).toBe(163100);
    expect(monthly[2].repeatRate).toBeCloseTo((7 / 15) * 100, 5);
  });
});

describe("summarizeLatestMonth", () => {
  it("compares the latest month against the previous one", async () => {
    const file = await loadSalesFixture();
    const { valid } = await parseSalesCsv(file);
    const summary = summarizeLatestMonth(aggregateMonthly(valid));

    expect(summary?.revenue.value).toBe(264700);
    // (264700 - 147500) / 147500 * 100
    expect(summary?.revenue.momChange).toBeCloseTo(((264700 - 147500) / 147500) * 100, 5);
  });
});
