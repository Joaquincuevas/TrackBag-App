-- TrackBag — esquema inicial
-- Todas las tablas llevan user_id y RLS estricto: cada usuario solo ve/toca lo suyo.

-- ============================================================
-- Enums
-- ============================================================
create type public.club_category as enum (
  'driver', 'madera', 'hibrido', 'hierro', 'wedge', 'putter'
);

create type public.club_condition as enum (
  'nuevo', 'bueno', 'usado'
);

-- ============================================================
-- profiles — extiende auth.users
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  phone       text,
  handicap    numeric(4, 1) check (handicap between -10 and 54),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- bags — una bolsa por usuario hoy, extensible a varias.
-- rfid_tag_id queda reservado para vincular con el sistema RFID de TrackBag.
-- ============================================================
create table public.bags (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  rfid_tag_id  text unique,
  created_at   timestamptz not null default now()
);

create index bags_user_id_idx on public.bags (user_id);

-- ============================================================
-- clubs
-- ============================================================
create table public.clubs (
  id               uuid primary key default gen_random_uuid(),
  bag_id           uuid not null references public.bags (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  category         public.club_category not null,
  brand            text not null check (char_length(brand) between 1 and 80),
  model            text not null check (char_length(model) between 1 and 120),
  loft             numeric(4, 1) check (loft between 0 and 80),
  shaft_flex       text check (char_length(shaft_flex) <= 40),
  shaft_material   text check (char_length(shaft_material) <= 40),
  serial_number    text check (char_length(serial_number) <= 120),
  condition        public.club_condition not null default 'bueno',
  purchase_date    date,
  estimated_value  numeric(12, 2) check (estimated_value >= 0),
  notes            text check (char_length(notes) <= 2000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index clubs_user_id_idx on public.clubs (user_id);
create index clubs_bag_id_idx on public.clubs (bag_id);

-- ============================================================
-- club_photos — varias fotos por palo (ángulos + detalle del nº de serie)
-- storage_path apunta al bucket privado 'club-photos', carpeta {user_id}/...
-- ============================================================
create table public.club_photos (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  storage_path text not null check (char_length(storage_path) <= 500),
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);

create index club_photos_club_id_idx on public.club_photos (club_id);
create index club_photos_user_id_idx on public.club_photos (user_id);

-- Solo una foto principal por palo.
create unique index club_photos_one_primary_per_club
  on public.club_photos (club_id)
  where is_primary;

-- ============================================================
-- updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger clubs_set_updated_at
  before update on public.clubs
  for each row execute function public.set_updated_at();

-- ============================================================
-- Perfil automático al crear un usuario en auth.users
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security — auth.uid() = user_id en TODO, sin excepción.
-- Sin política para roles anónimos: sin sesión no se lee nada.
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.bags        enable row level security;
alter table public.clubs       enable row level security;
alter table public.club_photos enable row level security;

-- profiles (la fila la crea el trigger; no hay INSERT ni DELETE por el cliente)
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- bags
create policy "bags_select_own" on public.bags
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "bags_insert_own" on public.bags
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "bags_update_own" on public.bags
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "bags_delete_own" on public.bags
  for delete to authenticated using ((select auth.uid()) = user_id);

-- clubs
create policy "clubs_select_own" on public.clubs
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "clubs_insert_own" on public.clubs
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "clubs_update_own" on public.clubs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "clubs_delete_own" on public.clubs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- club_photos
create policy "club_photos_select_own" on public.club_photos
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "club_photos_insert_own" on public.club_photos
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "club_photos_update_own" on public.club_photos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "club_photos_delete_own" on public.club_photos
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Integridad extra: el palo debe pertenecer a una bolsa del mismo usuario,
-- y la foto al palo del mismo usuario. RLS ya lo impide, esto lo hace
-- explícito también a nivel de datos.
create or replace function public.check_club_bag_owner()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.bags b
    where b.id = new.bag_id and b.user_id = new.user_id
  ) then
    raise exception 'bag does not belong to user';
  end if;
  return new;
end;
$$;

create trigger clubs_check_bag_owner
  before insert or update on public.clubs
  for each row execute function public.check_club_bag_owner();

create or replace function public.check_photo_club_owner()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.clubs c
    where c.id = new.club_id and c.user_id = new.user_id
  ) then
    raise exception 'club does not belong to user';
  end if;
  return new;
end;
$$;

create trigger club_photos_check_club_owner
  before insert or update on public.club_photos
  for each row execute function public.check_photo_club_owner();
