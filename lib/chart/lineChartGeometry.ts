export type ChartPoint = { label: string; value: number };

export type LineChartGeometry = {
  points: { x: number; y: number }[];
  yTicks: { y: number; value: number }[];
  xLabels: { x: number; label: string }[];
};

export type LineChartOptions = {
  width: number;
  height: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  yTickCount?: number;
};

export function buildLineChartGeometry(data: ChartPoint[], options: LineChartOptions): LineChartGeometry {
  const { width, height } = options;
  const paddingLeft = options.paddingLeft ?? 56;
  const paddingRight = options.paddingRight ?? 16;
  const paddingTop = options.paddingTop ?? 16;
  const paddingBottom = options.paddingBottom ?? 32;
  const yTickCount = options.yTickCount ?? 4;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const rawMax = values.length ? Math.max(...values) : 0;
  const rawMin = Math.min(0, ...values);
  const max = rawMax === rawMin ? rawMax + 1 : rawMax;

  const xStep = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const toX = (i: number) => paddingLeft + i * xStep;
  const toY = (value: number) => paddingTop + plotHeight * (1 - (value - rawMin) / (max - rawMin));

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const xLabels = data.map((d, i) => ({ x: toX(i), label: d.label }));

  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const value = rawMin + ((max - rawMin) * i) / yTickCount;
    return { y: toY(value), value };
  });

  return { points, yTicks, xLabels };
}
