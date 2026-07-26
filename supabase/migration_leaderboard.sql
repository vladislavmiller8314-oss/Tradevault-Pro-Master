-- Migration: Rangliste (opt-in, anonymisiert)
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

alter table profiles
  add column if not exists leaderboard_opt_in boolean not null default false,
  add column if not exists leaderboard_display_name text;

create or replace function public.get_leaderboard()
returns table (
  display_name text,
  trade_count bigint,
  winrate numeric,
  profit_factor numeric,
  is_me boolean
)
security definer
set search_path = public
language sql
as $$
  select
    coalesce(nullif(trim(p.leaderboard_display_name), ''), 'Trader') as display_name,
    count(t.id) as trade_count,
    round(100.0 * count(*) filter (where t.pnl > 0) / count(t.id), 1) as winrate,
    case
      when abs(coalesce(sum(t.pnl) filter (where t.pnl < 0), 0)) > 0
        then round(
          coalesce(sum(t.pnl) filter (where t.pnl > 0), 0)
          / abs(sum(t.pnl) filter (where t.pnl < 0)),
          2
        )
      else null
    end as profit_factor,
    (p.id = auth.uid()) as is_me
  from public.profiles p
  join public.trades t on t.user_id = p.id
  where p.leaderboard_opt_in = true
  group by p.id, p.leaderboard_display_name
  having count(t.id) >= 3
  order by profit_factor desc nulls last, winrate desc;
$$;

grant execute on function public.get_leaderboard() to authenticated;
