"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { parseSalesCsv } from "@/lib/csv/parser";
import { aggregateMonthly, summarizeLatestMonth } from "@/lib/kpi/aggregate";
import { analyzeSalesReport } from "@/lib/ai/analyze";
import { createClient } from "@/lib/supabase/server";

async function loadSampleSales(): Promise<File> {
  const filePath = path.join(process.cwd(), "lib/csv/__fixtures__/sales-sample.csv");
  const buffer = await readFile(filePath);
  return new File([buffer], "sales-sample.csv", { type: "text/csv" });
}

export async function runAnalysis() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("ログインが必要です");
  }

  const file = await loadSampleSales();
  const { valid } = await parseSalesCsv(file);
  const monthly = aggregateMonthly(valid);
  const summary = summarizeLatestMonth(monthly);
  if (!summary) {
    throw new Error("集計できるデータがありません");
  }

  const analysis = await analyzeSalesReport({ monthly, summary });

  const { error } = await supabase.from("reports").insert({
    uploaded_by: user.id,
    source: "sample",
    monthly_kpi: monthly,
    summary_kpi: summary,
    ai_summary: analysis.summary,
    ai_actions: analysis.actions,
  });
  if (error) {
    throw new Error(`Supabaseへの保存に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
}
