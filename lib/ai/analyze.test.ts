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
const { parseSalesCsv } = await import("@/lib/csv/parser");
const { aggregateMonthly, summarizeLatestMonth } = await import("@/lib/kpi/aggregate");

async function loadSalesFixture(): Promise<File> {
  const filePath = path.join(import.meta.dirname, "../csv/__fixtures__/sales-sample.csv");
  const buffer = await readFile(filePath);
  return new File([buffer], "sales-sample.csv", { type: "text/csv" });
}

beforeEach(() => {
  createMock.mockReset();
});

describe("analyzeSalesReport", () => {
  it("sends the real aggregated CSV numbers to Claude and returns a validated Analysis object", async () => {
    const file = await loadSalesFixture();
    const { valid } = await parseSalesCsv(file);
    const monthly = aggregateMonthly(valid);
    const summary = summarizeLatestMonth(monthly);
    if (!summary) throw new Error("fixture produced no monthly summary");

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

    const result = await analyzeSalesReport({ monthly, summary });

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

    await expect(analyzeSalesReport({ monthly: [], summary: emptySummary })).rejects.toThrow();
  });
});
