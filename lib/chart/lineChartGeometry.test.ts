import { describe, it, expect } from "vitest";
import { buildLineChartGeometry } from "./lineChartGeometry";

describe("buildLineChartGeometry", () => {
  it("places the first point at paddingLeft and the last point at width - paddingRight", () => {
    const geometry = buildLineChartGeometry(
      [
        { label: "9月", value: 100 },
        { label: "10月", value: 50 },
        { label: "11月", value: 200 },
      ],
      { width: 900, height: 260 }
    );

    expect(geometry.points).toHaveLength(3);
    expect(geometry.points[0].x).toBe(56); // default paddingLeft
    expect(geometry.points[2].x).toBe(900 - 16); // width - default paddingRight
  });

  it("maps the maximum value to the top of the plot area and 0 to the bottom", () => {
    const geometry = buildLineChartGeometry(
      [
        { label: "9月", value: 0 },
        { label: "10月", value: 200 },
      ],
      { width: 900, height: 260 }
    );

    const paddingTop = 16;
    const paddingBottom = 32;
    const plotBottom = 260 - paddingBottom;

    expect(geometry.points[1].y).toBeCloseTo(paddingTop, 5); // max value -> top
    expect(geometry.points[0].y).toBeCloseTo(plotBottom, 5); // 0 -> bottom
  });

  it("does not divide by zero when every value is identical", () => {
    const geometry = buildLineChartGeometry(
      [
        { label: "9月", value: 100 },
        { label: "10月", value: 100 },
      ],
      { width: 900, height: 260 }
    );

    expect(geometry.points.every((p) => Number.isFinite(p.y))).toBe(true);
  });
});
