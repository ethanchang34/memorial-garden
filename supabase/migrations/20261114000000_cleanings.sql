alter table public.memorials add column last_cleaned_at timestamptz;

create table public.cleanings (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  cleaned_by uuid references public.profiles (id) on delete set null,
  cleaned_on date not null,
  cleaned_at timestamptz not null default now()
);

create unique index cleanings_once_a_day on public.cleanings (memorial_id, cleaned_by, cleaned_on);
create index cleanings_memorial_idx on public.cleanings (memorial_id, cleaned_at desc);

alter table public.cleanings enable row level security;

revoke all on public.cleanings from public, anon, authenticated;
grant select on public.cleanings to authenticated;

create policy "Visitors see their own cleanings"
  on public.cleanings for select
  to authenticated
  using ((select auth.uid()) = cleaned_by);

create function private.stone_state(target_memorial uuid, viewer uuid)
returns table (dirty_since timestamptz, cleaned_today boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(m.last_cleaned_at, m.published_at, m.created_at),
    viewer is not null and exists (
      select 1
      from public.cleanings c
      join public.profiles p on p.id = viewer
      where c.memorial_id = target_memorial
        and c.cleaned_by = viewer
        and c.cleaned_on = (now() at time zone p.time_zone)::date
    )
  from public.memorials m
  where m.id = target_memorial;
$$;

create function public.stone_state(target_memorial uuid)
returns table (dirty_since timestamptz, cleaned_today boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select s.*
  from private.stone_state(target_memorial, auth.uid()) as s
  where exists (
    select 1 from public.memorials m
    where m.id = target_memorial
      and (m.status = 'published' or (m.owner_id = auth.uid() and m.status = 'draft'))
  );
$$;

create function public.clean_stone(target_memorial uuid)
returns table (dirty_since timestamptz, cleaned_today boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  visitor uuid := auth.uid();
  today date;
begin
  if visitor is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if not exists (select 1 from public.memorials m where m.id = target_memorial and m.status = 'published') then
    raise exception 'Memorial not found' using errcode = 'P0002';
  end if;

  select (now() at time zone p.time_zone)::date into today
  from public.profiles p
  where p.id = visitor and p.status = 'active';

  if today is null then
    raise exception 'Visitor not allowed' using errcode = '42501';
  end if;

  begin
    insert into public.cleanings (memorial_id, cleaned_by, cleaned_on) values (target_memorial, visitor, today);
  exception when unique_violation then
    raise exception 'Already cleaned this stone today' using errcode = 'P0001', hint = 'stone_daily_limit';
  end;

  update public.memorials set last_cleaned_at = now() where id = target_memorial;

  return query select * from private.stone_state(target_memorial, visitor);
end;
$$;

revoke all on function private.stone_state(uuid, uuid) from public, anon, authenticated;
revoke all on function public.stone_state(uuid) from public, anon, authenticated;
revoke all on function public.clean_stone(uuid) from public, anon, authenticated;
grant execute on function public.stone_state(uuid) to anon, authenticated;
grant execute on function public.clean_stone(uuid) to authenticated;
