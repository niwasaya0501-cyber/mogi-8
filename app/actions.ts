"use server";

import { revalidatePath } from "next/cache";
import { parseSalesCsv } from "@/lib/csv/parser";
import { aggregateMonthly, summarizeLatestMonth } from "@/lib/kpi/aggregate";
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

  const file = formData.get("salesCsv");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "CSVファイルを選択してください。" };
  }

  const { valid, invalid } = await parseSalesCsv(file);
  if (valid.length === 0) {
    return {
      status: "error",
      message: "有効な行が1件も見つかりませんでした。CSVの列名や中身を確認してください。",
    };
  }

  const monthly = aggregateMonthly(valid);
  const summary = summarizeLatestMonth(monthly);
  if (!summary) {
    return { status: "error", message: "集計できるデータがありませんでした。" };
  }

  let analysis;
  try {
    analysis = await analyzeSalesReport({ monthly, summary });
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
        ? `分析が完了しました（${skipped}件の行は形式エラーのためスキップしました）`
        : "分析が完了しました",
  };
}
