import { Card, CardHeader } from "@/components/ui/card";
import type { Analysis } from "@/lib/ai/schema";

export function AiSummary({ analysis }: { analysis: Analysis }) {
  return (
    <Card className="border-l-4 border-l-brand-navy">
      <CardHeader className="space-y-3">
        <p className="text-sm font-semibold text-zinc-600">AI分析サマリー</p>
        <p className="text-base leading-relaxed text-zinc-800">{analysis.summary}</p>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-600">次に取るべきアクション</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-800">
            {analysis.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      </CardHeader>
    </Card>
  );
}
