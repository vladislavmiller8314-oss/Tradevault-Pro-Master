-- Migration: Mehrere Musik-Links pro Nutzer
-- Nur nötig, wenn du supabase/schema.sql bereits VOR dieser Änderung
-- ausgeführt hast. Einmalig im Supabase SQL-Editor ausführen.

create table if not exists music_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('spotify','apple_music','youtube_music','soundcloud')),
  url text not null,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists music_links_user_idx on music_links (user_id, created_at);

alter table music_links enable row level security;

drop policy if exists "music_links: eigene Links" on music_links;
create policy "music_links: eigene Links" on music_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Übernimmt einen eventuell schon vorhandenen einzelnen Musik-Link aus
-- dem alten profiles.music_url-Feld in die neue Tabelle, damit nichts
-- verloren geht.
insert into music_links (user_id, provider, url)
select id, music_provider, music_url
from profiles
where music_provider is not null
  and music_provider != 'none'
  and music_url is not null
  and music_url != '';

-- Nebenbei behoben: coach_insights hatte eine RLS-Policy, aber Row Level
-- Security war für die Tabelle nie eingeschaltet — dadurch griff die
-- Policy bisher gar nicht. Hier nachgezogen.
alter table coach_insights enable row level security;
