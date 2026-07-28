-- TradeVault Pro — Supabase Schema
-- Alle Tabellen sind per Row Level Security auf den jeweiligen user_id
-- beschränkt, sodass Trader nur ihre eigenen Konten/Trades sehen.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- Profiles (1:1 zu auth.users, für Anzeigename, Präferenzen, Widgets)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  active_widgets text[] default array[
    'balance','pnl','winrate','profit_factor','equity_curve',
    'recent_trades','accounts_overview','market_monitor',
    'economic_calendar','new_trade'
  ],
  music_provider text check (music_provider in ('spotify','apple_music','youtube_music','soundcloud','none')) default 'none',
  music_url text,                         -- eingebetteter Track/Playlist-Link des gewählten Anbieters
  leaderboard_opt_in boolean not null default false,
  leaderboard_display_name text,          -- öffentlicher Anzeigename, falls opt-in (nie die echte E-Mail)
  trading_rules text[] not null default array[]::text[],  -- persönliches Regelwerk, frei editierbar
  created_at timestamptz not null default now()
);

-- Legt automatisch eine profiles-Zeile an, sobald sich jemand über
-- Supabase Auth registriert — ohne das müsste die App das selbst prüfen.
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

-- ---------------------------------------------------------------------
-- Accounts (beliebig viele je Trader: Prop, Live, Demo, Evaluation)
-- ---------------------------------------------------------------------
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('Prop','Live','Demo','Evaluation')),
  starting_balance numeric(14,2) not null default 0,
  currency text not null default 'USD',
  broker text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index accounts_user_id_idx on accounts (user_id);

-- ---------------------------------------------------------------------
-- Trades
-- ---------------------------------------------------------------------
create table trades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  instrument text not null,               -- z.B. ES, NQ, MES, MNQ, CL, GC
  direction text not null check (direction in ('Long','Short')),
  contracts numeric(10,2) not null,
  entry_price numeric(14,5) not null,
  exit_price numeric(14,5) not null,
  stop_price numeric(14,5),
  target_price numeric(14,5),
  fees numeric(10,2) not null default 0,
  pnl numeric(14,2) not null,             -- serverseitig berechnet oder eingetragen
  setup text,                             -- z.B. "ORB", "VWAP Reject"
  emotion text,                           -- z.B. "Diszipliniert", "FOMO", "Rache"
  rule_adherence text check (rule_adherence in ('eingehalten','teilweise','gebrochen')),
  improvement_note text,                  -- kurze Notiz: "nächstes Mal besser machen"
  pre_trade_emotion text,                 -- Emotion VOR dem Trade (z.B. "Ruhig", "Nervös")
  screenshot_url text,
  notes text,
  opened_at timestamptz not null,
  closed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index trades_user_id_idx on trades (user_id);
create index trades_account_id_idx on trades (account_id);
create index trades_closed_at_idx on trades (closed_at);
create index trades_instrument_idx on trades (instrument);
create index trades_setup_idx on trades (setup);

-- ---------------------------------------------------------------------
-- Equity-Snapshots (für die Equity Curve, täglich aggregiert)
-- ---------------------------------------------------------------------
create table equity_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  snapshot_date date not null,
  equity numeric(14,2) not null,
  unique (account_id, snapshot_date)
);

create index equity_snapshots_account_idx on equity_snapshots (account_id, snapshot_date);

-- ---------------------------------------------------------------------
-- Replay-Highlights (Hall of Fame / Hall of Shame)
-- ---------------------------------------------------------------------
create table trade_highlights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trade_id uuid not null references trades (id) on delete cascade,
  category text not null check (category in ('hall_of_fame','hall_of_shame')),
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- KI-Coach: gespeicherte Analysen (damit nicht bei jedem Seitenaufruf neu
-- generiert werden muss — kostet sonst unnötig API-Aufrufe)
-- ---------------------------------------------------------------------
create table coach_insights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content jsonb not null,          -- [{type: 'staerke'|'schwaeche'|'tipp', text: '...'}]
  trade_count int not null,        -- wie viele Trades zum Zeitpunkt der Analyse einflossen
  source text not null default 'free' check (source in ('free','ai')),
  created_at timestamptz not null default now()
);

create index coach_insights_user_idx on coach_insights (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table trades enable row level security;
alter table equity_snapshots enable row level security;
alter table trade_highlights enable row level security;

create policy "profiles: eigene Zeile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "accounts: eigene Konten" on accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trades: eigene Trades" on trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "equity_snapshots: eigene Snapshots" on equity_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "trade_highlights: eigene Highlights" on trade_highlights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "coach_insights: eigene Analysen" on coach_insights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Storage: Bucket für Trade-Screenshots
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('trade-screenshots', 'trade-screenshots', true)
on conflict (id) do nothing;

-- Jeder Trader darf nur in seinen eigenen Ordner (user_id/...) hochladen,
-- lesen, aktualisieren und löschen. Der Bucket ist "public" für einfache
-- Anzeige der Bilder per URL; der Upload-Pfad selbst bleibt geschützt.
create policy "trade-screenshots: eigener Ordner lesen" on storage.objects
  for select using (bucket_id = 'trade-screenshots');

create policy "trade-screenshots: eigener Ordner hochladen" on storage.objects
  for insert with check (
    bucket_id = 'trade-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "trade-screenshots: eigener Ordner löschen" on storage.objects
  for delete using (
    bucket_id = 'trade-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- Rangliste (opt-in, anonymisiert)
-- ---------------------------------------------------------------------
-- Zeigt NIE einzelne Trades oder echte Euro-/Dollar-Beträge — nur
-- Winrate und Profit Factor je Nutzer, und auch nur für Nutzer, die
-- aktiv per leaderboard_opt_in zugestimmt haben. Läuft als
-- SECURITY DEFINER, damit die Funktion trades/profiles über alle Nutzer
-- hinweg lesen darf, ohne die strikten RLS-Policies auf den Tabellen
-- selbst aufzuweichen — nach außen kommen ausschließlich die
-- aggregierten Werte unten an.
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
