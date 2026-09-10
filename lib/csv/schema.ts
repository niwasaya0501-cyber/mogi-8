import { z } from "zod";
import { parseFlexibleDate } from "./parseDate";

export const SaleRowSchema = z.object({
  order_date: z.string().min(1).transform(parseFlexibleDate),
  customer_id: z.string().min(1),
  product_name: z.string().min(1),
  category: z.string().optional(),
  sku: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  revenue: z.coerce.number().nonnegative(),
  cost: z.coerce.number().nonnegative(),
});

export type SaleRow = z.infer<typeof SaleRowSchema>;

export const InventoryRowSchema = z.object({
  sku: z.string().min(1),
  product_name: z.string().min(1),
  category: z.string().optional(),
  stock_quantity: z.coerce.number().int().nonnegative(),
});

export type InventoryRow = z.infer<typeof InventoryRowSchema>;
