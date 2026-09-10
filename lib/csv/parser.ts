import Papa from "papaparse";
import { z } from "zod";
import { normalizeHeader } from "./normalizeHeader";
import { SaleRowSchema, InventoryRowSchema, type SaleRow, type InventoryRow } from "./schema";

export type InvalidRow = { row: number; reason: string };
export type ParseResult<T> = { valid: T[]; invalid: InvalidRow[] };

async function parseCsv<T>(file: File, schema: z.ZodType<T>): Promise<ParseResult<T>> {
  const text = await file.text();
  const { data } = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  const valid: T[] = [];
  const invalid: InvalidRow[] = [];

  data.forEach((row, i) => {
    const result = schema.safeParse(row);
    if (result.success) valid.push(result.data);
    else invalid.push({ row: i + 2, reason: result.error.message });
  });

  return { valid, invalid };
}

export function parseSalesCsv(file: File): Promise<ParseResult<SaleRow>> {
  return parseCsv(file, SaleRowSchema);
}

export function parseInventoryCsv(file: File): Promise<ParseResult<InventoryRow>> {
  return parseCsv(file, InventoryRowSchema);
}
