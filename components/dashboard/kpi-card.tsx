import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: number;
  format: "currency" | "percent";
  momChange?: number;
};

function formatValue(value: number, format: KpiCardProps["format"]) {
  if (format === "currency") return `¥${Math.round(value).toLocaleString()}`;
  return `${value.toFixed(1)}%`;
}

export function KpiCard({ label, value, format, momChange }: KpiCardProps) {
  return (
    <Card className="border-l-4 border-l-brand-navy">
      <CardHeader>
        <p className="text-sm text-zinc-600">{label}</p>
        <p className="text-3xl font-bold text-brand-navy">{formatValue(value, format)}</p>
        {momChange !== undefined && (
          <p className={cn("text-sm", momChange > 0 ? "text-green-600" : momChange < 0 ? "text-red-600" : "text-zinc-500")}>
            前月比 {momChange > 0 ? "+" : ""}
            {momChange.toFixed(1)}%
          </p>
        )}
      </CardHeader>
    </Card>
  );
}
