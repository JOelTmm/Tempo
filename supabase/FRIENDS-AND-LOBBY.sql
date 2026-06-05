-- Amis + salons lobby (exécuter dans Supabase SQL Editor)

alter table public.tempo_rooms drop constraint if exists tempo_rooms_game_check;
alter table public.tempo_rooms add constraint tempo_rooms_game_check
  check (game in ('flashquiz', 'rolengamos', 'pixelcover', 'speedlyrics', 'lobby'));

create table if not exists public.tempo_friends (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  friend_email text not null,
  friend_name text not null default '',
  created_at timestamptz not null default now(),
  unique (owner_email, friend_email)
);

alter table public.tempo_friends enable row level security;

create policy "tempo_friends_select_anon"
  on public.tempo_friends for select to anon, authenticated using (true);

create policy "tempo_friends_insert_anon"
  on public.tempo_friends for insert to anon, authenticated with check (true);

create policy "tempo_friends_delete_anon"
  on public.tempo_friends for delete to anon, authenticated using (true);