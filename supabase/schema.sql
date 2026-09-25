-- ============================================================
-- SRM Campus Visual Archive - database schema
-- Paste this whole file into Supabase -> SQL Editor -> Run.
-- Safe to re-run.
-- ============================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  handle      text not null,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.photos (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  storage_path   text not null,
  location_id    text not null,
  taken_on       date not null,
  category       text not null,
  caption        text not null,
  allow_download boolean not null default true,
  status         text not null default 'live',   -- live | removed
  width          int,
  height         int,
  created_at     timestamptz not null default now()
);
create index if not exists photos_location_idx on public.photos(location_id) where status = 'live';
create index if not exists photos_taken_idx    on public.photos(taken_on desc) where status = 'live';
create index if not exists photos_owner_idx    on public.photos(owner_id);

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  photo_id     uuid not null references public.photos(id) on delete cascade,
  reporter_id  uuid not null references auth.users(id) on delete cascade,
  reason       text not null,
  status       text not null default 'open',     -- open | dismissed | removed
  created_at   timestamptz not null default now(),
  unique (photo_id, reporter_id)
);

-- ============================================================
-- Domain lock: only @srmap.edu.in accounts become profiles.
-- Change the domain on the line marked below if yours differs.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  allowed_domain text := 'srmap.edu.in';   -- <== change here
begin
  if split_part(new.email, '@', 2) <> allowed_domain then
    raise exception 'Only % accounts can register', allowed_domain;
  end if;

  insert into public.profiles (id, email, handle)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ============================================================
-- Row level security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.photos   enable row level security;
alter table public.reports  enable row level security;

drop policy if exists "profiles readable by members" on public.profiles;
create policy "profiles readable by members" on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "members read live photos" on public.photos;
create policy "members read live photos" on public.photos
  for select using (
    auth.uid() is not null and (status = 'live' or owner_id = auth.uid() or public.is_admin())
  );

drop policy if exists "srm members insert own photos" on public.photos;
create policy "srm members insert own photos" on public.photos
  for insert with check (
    owner_id = auth.uid()
    and split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2) = 'srmap.edu.in'
  );

drop policy if exists "owner or admin updates photo" on public.photos;
create policy "owner or admin updates photo" on public.photos
  for update using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "owner or admin deletes photo" on public.photos;
create policy "owner or admin deletes photo" on public.photos
  for delete using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "members file reports" on public.reports;
create policy "members file reports" on public.reports
  for insert with check (reporter_id = auth.uid());

drop policy if exists "admins read reports" on public.reports;
create policy "admins read reports" on public.reports
  for select using (public.is_admin() or reporter_id = auth.uid());

drop policy if exists "admins resolve reports" on public.reports;
create policy "admins resolve reports" on public.reports
  for update using (public.is_admin());

-- ============================================================
-- Storage bucket (private - files served through signed URLs)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "members read photo objects" on storage.objects;
create policy "members read photo objects" on storage.objects
  for select using (bucket_id = 'photos' and auth.uid() is not null);

drop policy if exists "members write own photo objects" on storage.objects;
create policy "members write own photo objects" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 2) = 'srmap.edu.in'
  );

-- ============================================================
-- Make yourself a moderator (run after your first sign-in):
--   update public.profiles set is_admin = true where email = 'you@srmap.edu.in';
-- ============================================================
