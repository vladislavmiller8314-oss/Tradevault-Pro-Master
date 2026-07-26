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
