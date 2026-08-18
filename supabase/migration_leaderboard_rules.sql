-- Migration: Regeltreue (letzte 20 Tage) in der Rangliste
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

-- Postgres erlaubt kein CREATE OR REPLACE, wenn sich die Rückgabespalten
-- einer Funktion ändern — deshalb hier erst löschen, dann neu anlegen.
drop function if exists public.get_leaderboard();

create or replace function public.get_leaderboard()
returns table (
  display_name text,
  trade_count bigint,
  winrate numeric,
  profit_factor numeric,
  rule_adherence_pct numeric,
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
    case
      when count(*) filter (
        where t.rule_adherence is not null and t.closed_at >= now() - interval '20 days'
      ) > 0
        then round(
          100.0 * count(*) filter (
            where t.rule_adherence = 'eingehalten' and t.closed_at >= now() - interval '20 days'
          )
          / count(*) filter (
            where t.rule_adherence is not null and t.closed_at >= now() - interval '20 days'
          ),
          1
        )
      else null
    end as rule_adherence_pct,
    (p.id = auth.uid()) as is_me
  from public.profiles p
  join public.trades t on t.user_id = p.id
  where p.leaderboard_opt_in = true
  group by p.id, p.leaderboard_display_name
  having count(t.id) >= 3
  order by profit_factor desc nulls last, winrate desc;
$$;

grant execute on function public.get_leaderboard() to authenticated;
