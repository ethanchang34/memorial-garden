create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    check (char_length(display_name) between 1 and 40 and display_name = btrim(display_name)),
  avatar_url text,
  time_zone text not null default 'UTC',
  time_zone_changed_at timestamptz,
  locale text not null default 'en' check (locale ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  is_admin boolean not null default false,
  status text not null default 'active' check (status in ('active', 'suspended', 'banned')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, locale) on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function private.default_display_name(full_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  with parts as (
    select regexp_split_to_array(btrim(coalesce(full_name, '')), '\s+') as names
  )
  select case
    when names[1] = '' then 'Member'
    when cardinality(names) = 1 then left(names[1], 40)
    else left(names[1], 37) || ' ' || upper(left(names[cardinality(names)], 1)) || '.'
  end
  from parts;
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    private.default_display_name(
      coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
    ),
    nullif(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'), '')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function public.set_time_zone(requested_time_zone text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_profile public.profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if not exists (select 1 from pg_catalog.pg_timezone_names where name = requested_time_zone) then
    raise exception 'Unknown time zone: %', requested_time_zone using errcode = '22023';
  end if;

  select * into current_profile from public.profiles where id = current_user_id for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if current_profile.time_zone = requested_time_zone then
    return current_profile.time_zone;
  end if;

  if current_profile.time_zone_changed_at is not null
    and current_profile.time_zone_changed_at > now() - interval '7 days' then
    return current_profile.time_zone;
  end if;

  update public.profiles
  set time_zone = requested_time_zone, time_zone_changed_at = now()
  where id = current_user_id;

  return requested_time_zone;
end;
$$;

revoke all on function private.default_display_name(text) from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_time_zone(text) from public, anon, authenticated;
grant execute on function public.set_time_zone(text) to authenticated;
