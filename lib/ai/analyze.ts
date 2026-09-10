import Anthropic from "@anthropic-ai/sdk";
import { AnalysisSchema, type Analysis } from "./schema";
import { extractJson } from "./extractJson";
import { ANALYSIS_SYSTEM_PROMPT } from "./prompt";
import type { KpiSummary, MonthlyKpi } from "@/lib/kpi/aggregate";

const client = new Anthropic();

export type SalesReportInput = {
  monthly: MonthlyKpi[];
  summary: KpiSummary;
};

export async function analyzeSalesReport(input: SalesReportInput): Promise<Analysis> {
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: `今月の売上データ:\n${JSON.stringify(input, null, 2)}` }],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Claudeからテキスト形式の応答が得られませんでした");
  }

  const parsedJson = JSON.parse(extractJson(block.text));
  return AnalysisSchema.parse(parsedJson);
}
