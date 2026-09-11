-- 売上レポート（KPI集計結果 + AI分析結果）の保存先
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references auth.users (id),
  source text not null default 'sample',
  monthly_kpi jsonb not null,
  summary_kpi jsonb not null,
  ai_summary text not null,
  ai_actions jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- 社内共有ダッシュボードのため、ログイン済みユーザー全員が全レポートを閲覧できる
create policy "authenticated can read reports"
on public.reports
for select
to authenticated
using (true);

-- 登録は本人名義でのみ可能
create policy "authenticated can insert own reports"
on public.reports
for insert
to authenticated
with check ((select auth.uid()) = uploaded_by);
