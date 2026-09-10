import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseSalesCsv, parseInventoryCsv } from "./parser";

const fixturesDir = path.join(import.meta.dirname, "__fixtures__");

async function loadFile(name: string): Promise<File> {
  const buffer = await readFile(path.join(fixturesDir, name));
  return new File([buffer], name, { type: "text/csv" });
}

describe("parseSalesCsv", () => {
  it("parses every row in the clean sample as valid", async () => {
    const file = await loadFile("sales-sample.csv");
    const { valid, invalid } = await parseSalesCsv(file);

    expect(invalid).toEqual([]);
    expect(valid).toHaveLength(40);
    expect(valid[0]).toMatchObject({
      customer_id: "C001",
      sku: "LUM-TOP-01",
      quantity: 2,
      revenue: 7600,
      cost: 2800,
    });
    expect(valid[0].order_date).toBeInstanceOf(Date);
  });

  it("normalizes header aliases and slash-formatted dates", async () => {
    const file = await loadFile("sales-with-invalid-rows.csv");
    const { valid } = await parseSalesCsv(file);

    const slashDateRow = valid.find((r) => r.sku === "LUM-OUT-02");
    expect(slashDateRow?.order_date.getFullYear()).toBe(2025);
    expect(slashDateRow?.order_date.getMonth()).toBe(8); // 0-indexed: September
    expect(slashDateRow?.order_date.getDate()).toBe(5);
  });

  it("collects invalid rows with the correct file line number and reason, without dropping valid ones", async () => {
    const file = await loadFile("sales-with-invalid-rows.csv");
    const { valid, invalid } = await parseSalesCsv(file);

    // 6 data rows total: 3 valid (line 2, 3, 7), 3 invalid (line 4: empty sku, line 5: negative quantity, line 6: non-numeric revenue)
    expect(valid).toHaveLength(3);
    expect(invalid).toHaveLength(3);
    expect(invalid.map((r) => r.row)).toEqual([4, 5, 6]);
    invalid.forEach((r) => expect(r.reason.length).toBeGreaterThan(0));
  });
});

describe("parseInventoryCsv", () => {
  it("parses every row in the inventory sample as valid", async () => {
    const file = await loadFile("inventory-sample.csv");
    const { valid, invalid } = await parseInventoryCsv(file);

    expect(invalid).toEqual([]);
    expect(valid).toHaveLength(8);
    expect(valid[0]).toMatchObject({
      sku: "LUM-TOP-01",
      product_name: "オーガニックコットンTシャツ",
      stock_quantity: 20,
    });
  });
});
