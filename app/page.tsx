import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { AiSummary } from "@/components/dashboard/ai-summary";
import { Card, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { MonthlyKpi, KpiSummary } from "@/lib/kpi/aggregate";
import { AnalysisSchema } from "@/lib/ai/schema";
import { runAnalysis } from "./actions";
import { signOut } from "./auth/actions";

type ReportRow = {
  monthly_kpi: MonthlyKpi[];
  summary_kpi: KpiSummary;
  ai_summary: string;
  ai_actions: string[];
  created_at: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: report },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("reports")
      .select("monthly_kpi, summary_kpi, ai_summary, ai_actions, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<ReportRow>(),
  ]);

  const analysis = report
    ? AnalysisSchema.safeParse({ summary: report.ai_summary, actions: report.ai_actions })
    : undefined;

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">AI売上ダッシュボード</h1>
          {user ? <p className="text-sm text-zinc-500">{user.email}としてログイン中</p> : null}
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-zinc-500 underline">
            ログアウト
          </button>
        </form>
      </div>

      {report ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard label="売上" format="currency" value={report.summary_kpi.revenue.value} momChange={report.summary_kpi.revenue.momChange} />
            <KpiCard label="粗利" format="currency" value={report.summary_kpi.profit.value} momChange={report.summary_kpi.profit.momChange} />
            <KpiCard label="リピート率" format="percent" value={report.summary_kpi.repeatRate.value} momChange={report.summary_kpi.repeatRate.momChange} />
          </div>

          <RevenueTrendChart data={report.monthly_kpi.map((m) => ({ month: m.month, revenue: m.revenue }))} />

          {analysis?.success ? <AiSummary analysis={analysis.data} /> : null}

          <p className="text-xs text-zinc-400">
            最終分析日時: {new Date(report.created_at).toLocaleString("ja-JP")}
          </p>
        </>
      ) : (
        <Card>
          <CardHeader>
            <p className="text-sm text-zinc-600">まだ分析結果がありません。下のボタンからAI分析を実行してください。</p>
          </CardHeader>
        </Card>
      )}

      <form action={runAnalysis}>
        <button type="submit" className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white">
          AI分析を実行
        </button>
      </form>
    </main>
  );
}
