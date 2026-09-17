import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseInventoryCsv, parseSalesCsv } from "@/lib/csv/parser";
import {
  aggregateCategoryBreakdown,
  aggregateInventoryTurnover,
  aggregateMonthly,
  aggregateSkuRanking,
  summarizeLatestMonth,
} from "./aggregate";

async function loadFixture(name: string): Promise<File> {
  const filePath = path.join(import.meta.dirname, "../csv/__fixtures__", name);
  const buffer = await readFile(filePath);
  return new File([buffer], name, { type: "text/csv" });
}

async function loadSalesFixture(): Promise<File> {
  return loadFixture("sales-sample.csv");
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

describe("aggregateCategoryBreakdown", () => {
  it("sums revenue/profit per category and computes share of total revenue", async () => {
    const file = await loadSalesFixture();
    const { valid } = await parseSalesCsv(file);
    const breakdown = aggregateCategoryBreakdown(valid);

    expect(breakdown.map((b) => b.category)).toEqual(["アウター", "トップス", "ボトムス", "アクセサリー"]);
    expect(breakdown[0]).toMatchObject({ category: "アウター", revenue: 287400, profit: 175400 });
    expect(breakdown[0].share).toBeCloseTo((287400 / 560600) * 100, 5);
  });
});

describe("aggregateSkuRanking", () => {
  it("ranks SKUs by revenue and limits to top N", async () => {
    const file = await loadSalesFixture();
    const { valid } = await parseSalesCsv(file);
    const ranking = aggregateSkuRanking(valid, 3);

    expect(ranking).toHaveLength(3);
    expect(ranking[0]).toMatchObject({ sku: "LUM-OUT-01", productName: "ウールコート", quantity: 6, revenue: 148800 });
    expect(ranking[1]).toMatchObject({ sku: "LUM-OUT-02", quantity: 7, revenue: 138600 });
    expect(ranking[2]).toMatchObject({ sku: "LUM-TOP-02", quantity: 9, revenue: 61200 });
  });
});

describe("aggregateInventoryTurnover", () => {
  it("computes sold-quantity / stock-quantity per SKU and flags stockout/excess risk", async () => {
    const salesFile = await loadSalesFixture();
    const inventoryFile = await loadFixture("inventory-sample.csv");
    const { valid: sales } = await parseSalesCsv(salesFile);
    const { valid: inventory } = await parseInventoryCsv(inventoryFile);

    const turnover = aggregateInventoryTurnover(sales, inventory);

    const belt = turnover.find((t) => t.sku === "LUM-ACC-01");
    expect(belt).toMatchObject({ soldQuantity: 8, stockQuantity: 6, risk: "stockout" });
    expect(belt?.turnoverRate).toBeCloseTo(8 / 6, 5);

    const skirt = turnover.find((t) => t.sku === "LUM-BTM-02");
    expect(skirt).toMatchObject({ soldQuantity: 4, stockQuantity: 18, risk: "excess" });
    expect(skirt?.turnoverRate).toBeCloseTo(4 / 18, 5);

    const tshirt = turnover.find((t) => t.sku === "LUM-TOP-01");
    expect(tshirt?.risk).toBe("normal");

    // 回転率の高い順にソートされる
    expect(turnover[0].sku).toBe("LUM-ACC-01");
  });
});
