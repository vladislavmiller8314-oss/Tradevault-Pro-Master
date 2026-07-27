-- Migration: KI-Coach (gespeicherte Analysen)
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

create table if not exists coach_insights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content jsonb not null,
  trade_count int not null,
  source text not null default 'free' check (source in ('free','ai')),
  created_at timestamptz not null default now()
);

alter table coach_insights add column if not exists source text not null default 'free' check (source in ('free','ai'));

create index if not exists coach_insights_user_idx on coach_insights (user_id, created_at desc);

alter table coach_insights enable row level security;

drop policy if exists "coach_insights: eigene Analysen" on coach_insights;
create policy "coach_insights: eigene Analysen" on coach_insights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
