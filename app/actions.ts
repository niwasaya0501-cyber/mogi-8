"use server";

import { revalidatePath } from "next/cache";
import { parseInventoryCsv, parseSalesCsv } from "@/lib/csv/parser";
import {
  aggregateCategoryBreakdown,
  aggregateInventoryTurnover,
  aggregateMonthly,
  aggregateSkuRanking,
  summarizeLatestMonth,
} from "@/lib/kpi/aggregate";
import { analyzeSalesReport } from "@/lib/ai/analyze";
import { createClient } from "@/lib/supabase/server";

export type UploadAnalysisState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function runAnalysisFromUpload(
  _prevState: UploadAnalysisState,
  formData: FormData,
): Promise<UploadAnalysisState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "ログインが必要です。再度ログインしてください。" };
  }

  const salesFile = formData.get("salesCsv");
  if (!(salesFile instanceof File) || salesFile.size === 0) {
    return { status: "error", message: "売上CSVファイルを選択してください。" };
  }

  const inventoryFile = formData.get("inventoryCsv");
  if (!(inventoryFile instanceof File) || inventoryFile.size === 0) {
    return { status: "error", message: "在庫CSVファイルを選択してください。" };
  }

  const { valid, invalid } = await parseSalesCsv(salesFile);
  if (valid.length === 0) {
    return {
      status: "error",
      message: "有効な行が1件も見つかりませんでした。売上CSVの列名や中身を確認してください。",
    };
  }

  const { valid: validInventory } = await parseInventoryCsv(inventoryFile);
  if (validInventory.length === 0) {
    return {
      status: "error",
      message: "有効な行が1件も見つかりませんでした。在庫CSVの列名や中身を確認してください。",
    };
  }

  const monthly = aggregateMonthly(valid);
  const summary = summarizeLatestMonth(monthly);
  if (!summary) {
    return { status: "error", message: "集計できるデータがありませんでした。" };
  }

  const categoryBreakdown = aggregateCategoryBreakdown(valid);
  const skuRanking = aggregateSkuRanking(valid);
  const inventoryTurnover = aggregateInventoryTurnover(valid, validInventory);

  let analysis;
  try {
    analysis = await analyzeSalesReport({ monthly, summary, categoryBreakdown, skuRanking, inventoryTurnover });
  } catch {
    return {
      status: "error",
      message: "AI分析でエラーが発生しました。しばらくしてからもう一度お試しください。",
    };
  }

  const { error } = await supabase.from("reports").insert({
    uploaded_by: user.id,
    source: "upload",
    monthly_kpi: monthly,
    summary_kpi: summary,
    category_breakdown: categoryBreakdown,
    sku_ranking: skuRanking,
    inventory_turnover: inventoryTurnover,
    ai_summary: analysis.summary,
    ai_actions: analysis.actions,
  });
  if (error) {
    return { status: "error", message: `保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/");

  const skipped = invalid.length;
  return {
    status: "success",
    message:
      skipped > 0
        ? `分析が完了しました（売上CSVの${skipped}件の行は形式エラーのためスキップしました）`
        : "分析が完了しました",
  };
}
