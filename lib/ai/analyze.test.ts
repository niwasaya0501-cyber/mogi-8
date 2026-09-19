import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { KpiSummary } from "@/lib/kpi/aggregate";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

const { analyzeSalesReport } = await import("./analyze");
const { parseInventoryCsv, parseSalesCsv } = await import("@/lib/csv/parser");
const {
  aggregateCategoryBreakdown,
  aggregateInventoryTurnover,
  aggregateMonthly,
  aggregateSkuRanking,
  summarizeKpi,
} = await import("@/lib/kpi/aggregate");

async function loadFixture(name: string): Promise<File> {
  const filePath = path.join(import.meta.dirname, "../csv/__fixtures__", name);
  const buffer = await readFile(filePath);
  return new File([buffer], name, { type: "text/csv" });
}

async function loadSalesFixture(): Promise<File> {
  return loadFixture("sales-sample.csv");
}

beforeEach(() => {
  createMock.mockReset();
});

describe("analyzeSalesReport", () => {
  it("sends the real aggregated CSV numbers to Claude and returns a validated Analysis object", async () => {
    const salesFile = await loadSalesFixture();
    const inventoryFile = await loadFixture("inventory-sample.csv");
    const { valid } = await parseSalesCsv(salesFile);
    const { valid: inventory } = await parseInventoryCsv(inventoryFile);
    const monthly = aggregateMonthly(valid);
    const summary = summarizeKpi(monthly, valid);
    if (!summary) throw new Error("fixture produced no monthly summary");
    const categoryBreakdown = aggregateCategoryBreakdown(valid);
    const skuRanking = aggregateSkuRanking(valid);
    const inventoryTurnover = aggregateInventoryTurnover(valid, inventory);

    createMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text:
            "```json\n" +
            JSON.stringify({
              summary: "9月から11月にかけて売上・粗利ともに右肩上がりで推移しています。",
              actions: [
                "在庫回転率が高いレザーベルトは欠品リスクがあるため早めに発注しましょう。",
                "動きの遅いフレアスカートは割引施策を検討しましょう。",
              ],
            }) +
            "\n```",
        },
      ],
    });

    const result = await analyzeSalesReport({ monthly, summary, categoryBreakdown, skuRanking, inventoryTurnover });

    // Claudeに実際に渡したプロンプト（=集計ロジックが出した実データ）をスナップショット化。
    // 集計ロジックやプロンプトの変更で数字の解釈がおかしくなったら、この差分で検知できる。
    const sentRequest = createMock.mock.calls[0][0];
    expect(sentRequest.messages[0].content).toMatchSnapshot("prompt sent to Claude");

    expect(result).toMatchSnapshot("parsed analysis result");
  });

  it("throws when Claude's response is not valid JSON matching the schema", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "すみません、うまく分析できませんでした。" }],
    });

    const emptySummary: KpiSummary = {
      revenue: { value: 0 },
      profit: { value: 0 },
      repeatRate: { value: 0 },
    };

    await expect(
      analyzeSalesReport({
        monthly: [],
        summary: emptySummary,
        categoryBreakdown: [],
        skuRanking: [],
        inventoryTurnover: [],
      }),
    ).rejects.toThrow();
  });
});
