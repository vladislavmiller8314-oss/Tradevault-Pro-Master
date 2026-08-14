-- TradeVault Pro — Gesammelte Nachträge
-- Fasst alle Datenbank-Änderungen zusammen, die nach deinem ersten
-- Ausführen von schema.sql dazugekommen sind:
--   1) Post-Trade-Reflexion (Regeleinhaltung + Verbesserungsnotiz)
--   2) Musik-URL im Profil + automatische Profil-Erstellung für neue Nutzer
--   3) Emotion VOR dem Trade
--
-- Kann gefahrlos mehrfach ausgeführt werden (alles ist "if not exists" /
-- "or replace" / "on conflict do nothing") — auch wenn ein Teil davon
-- schon vorhanden ist, gibt es dabei keinen Fehler.

-- 1) Post-Trade-Reflexion
alter table trades
  add column if not exists rule_adherence text
    check (rule_adherence in ('eingehalten','teilweise','gebrochen')),
  add column if not exists improvement_note text;

-- 2) Musik-URL im Profil
alter table profiles
  add column if not exists music_url text;

-- Legt automatisch eine profiles-Zeile an, sobald sich jemand über
-- Supabase Auth registriert.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Für bereits registrierte Nutzer ohne Profil-Zeile (falls vorhanden):
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- 3) Emotion vor dem Trade
alter table trades
  add column if not exists pre_trade_emotion text;

-- 4) Rangliste (opt-in, anonymisiert)
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

-- 5) Coach: gespeicherte Analysen (kostenlos + optional KI-gestützt)
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

-- 6) Persönliches Regelwerk (Widget)
alter table profiles
  add column if not exists trading_rules text[] not null default array[]::text[];

update profiles
set active_widgets = array_append(active_widgets, 'trading_rules')
where not ('trading_rules' = any(active_widgets));

NOTIFY pgrst, 'reload schema';
