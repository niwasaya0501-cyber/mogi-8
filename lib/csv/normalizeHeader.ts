const HEADER_ALIASES: Record<string, string> = {
  "order date": "order_date",
  "created at": "order_date",
  "注文日": "order_date",
  "customer id": "customer_id",
  "顧客id": "customer_id",
  "product name": "product_name",
  "商品名": "product_name",
  "category": "category",
  "カテゴリ": "category",
  "sku": "sku",
  "quantity": "quantity",
  "数量": "quantity",
  "revenue": "revenue",
  "売上": "revenue",
  "cost": "cost",
  "原価": "cost",
  "stock quantity": "stock_quantity",
  "在庫数": "stock_quantity",
};

export function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? key.replace(/\s+/g, "_");
}
