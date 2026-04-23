-- LightGlass Supabase schema
-- 在 Supabase SQL Editor 中执行此文件一次即可

-- 用户数据表：统一 KV 存储，支持扩展而不需新建表
create table if not exists public.user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

-- 启用 RLS
alter table public.user_data enable row level security;

-- 只有登录用户能读写自己的数据
create policy "users read their own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "users write their own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "users update their own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete their own data"
  on public.user_data for delete
  using (auth.uid() = user_id);

-- 辅助索引
create index if not exists user_data_user_id_idx on public.user_data (user_id);
