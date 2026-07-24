-- Migration: Musik-URL + automatische Profil-Erstellung
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

alter table profiles
  add column if not exists music_url text;

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
