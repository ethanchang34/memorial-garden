create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  avatar_url text,
  time_zone text not null default 'UTC',
  time_zone_changed_at timestamptz not null default now(),
  locale text not null default 'en',
  is_admin boolean not null default false,
  status text not null default 'active' check (status in ('active', 'suspended', 'banned')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url, time_zone, time_zone_changed_at, locale)
  on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  full_name text := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '');
  first_name text := nullif(split_part(trim(full_name), ' ', 1), '');
  last_name text := nullif(split_part(trim(full_name), ' ', 2), '');
  default_display_name text;
begin
  default_display_name := left(coalesce(first_name, 'Member'), 38)
    || case when last_name is null then '' else ' ' || left(last_name, 1) || '.' end;

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    default_display_name,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;
