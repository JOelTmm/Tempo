create table if not exists public.tempo_rooms (
  code text primary key,
  game text not null check (game in ('flashquiz', 'rolengamos')),
  host_id text not null,
  players jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists tempo_rooms_updated_at_idx on public.tempo_rooms (updated_at desc);

alter table public.tempo_rooms enable row level security;

drop policy if exists "tempo_rooms_select_anon" on public.tempo_rooms;
drop policy if exists "tempo_rooms_insert_anon" on public.tempo_rooms;
drop policy if exists "tempo_rooms_update_anon" on public.tempo_rooms;

create policy "tempo_rooms_select_anon" on public.tempo_rooms for select to anon, authenticated using (true);
create policy "tempo_rooms_insert_anon" on public.tempo_rooms for insert to anon, authenticated with check (true);
create policy "tempo_rooms_update_anon" on public.tempo_rooms for update to anon, authenticated using (true);