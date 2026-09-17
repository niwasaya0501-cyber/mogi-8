-- MVPの「あったら嬉しい枠」KPI（カテゴリ別売上・SKUトップ10・在庫回転率）の集計結果を追加保存する
alter table public.reports
  add column category_breakdown jsonb not null default '[]'::jsonb,
  add column sku_ranking jsonb not null default '[]'::jsonb,
  add column inventory_turnover jsonb not null default '[]'::jsonb;

comment on column public.reports.category_breakdown is 'カテゴリ別の売上・粗利・構成比（CategoryBreakdown[]）';
comment on column public.reports.sku_ranking is '売上順SKUトップ10（SkuRanking[]）';
comment on column public.reports.inventory_turnover is 'SKUごとの在庫回転率と欠品/過剰在庫リスク判定（InventoryTurnoverRow[]）。在庫CSVが無いと空配列';

-- RLS（select: authenticated全員 / insert: 本人のみ）は0001で定義済みのテーブル全体に適用されるため、
-- 列追加のみのこのマイグレーションでは新規ポリシーは不要
