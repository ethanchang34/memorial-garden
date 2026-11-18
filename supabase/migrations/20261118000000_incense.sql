alter table public.gesture_timers drop constraint gesture_timers_kind_check;
alter table public.gesture_timers add constraint gesture_timers_kind_check
  check (kind in ('candle', 'flower', 'incense'));

create table public.incense_sticks (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  lit_by uuid references public.profiles (id) on delete set null,
  lit_on date not null,
  lit_at timestamptz not null default clock_timestamp()
);

create unique index incense_once_a_day on public.incense_sticks (memorial_id, lit_by, lit_on);
create index incense_memorial_idx on public.incense_sticks (memorial_id, lit_at desc);

alter table public.incense_sticks enable row level security;

revoke all on public.incense_sticks from public, anon, authenticated;
grant select on public.incense_sticks to authenticated;

create policy "Visitors see the incense they lit"
  on public.incense_sticks for select
  to authenticated
  using ((select auth.uid()) = lit_by);

create function private.incense_state(target_memorial uuid, viewer uuid)
returns table (lit_count integer, lit_until timestamptz, lit_today boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when t.expires_at > now() then least(
        3,
        (select count(*) from public.incense_sticks s where s.memorial_id = target_memorial and s.lit_at >= t.started_at)
      )::integer
      else 0
    end,
    case when t.expires_at > now() then t.expires_at end,
    viewer is not null and exists (
      select 1
      from public.incense_sticks s
      join public.profiles p on p.id = viewer
      where s.memorial_id = target_memorial
        and s.lit_by = viewer
        and s.lit_on = (now() at time zone p.time_zone)::date
    )
  from (select 1) as one
  left join public.gesture_timers t on t.memorial_id = target_memorial and t.kind = 'incense';
$$;

create function public.incense_state(target_memorial uuid)
returns table (lit_count integer, lit_until timestamptz, lit_today boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select s.*
  from private.incense_state(target_memorial, auth.uid()) as s
  where exists (
    select 1 from public.memorials m
    where m.id = target_memorial
      and (m.status = 'published' or (m.owner_id = auth.uid() and m.status = 'draft'))
  );
$$;

create function public.light_incense(target_memorial uuid)
returns table (lit_count integer, lit_until timestamptz, lit_today boolean)
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

  perform pg_advisory_xact_lock(hashtextextended('incense:' || target_memorial::text, 0));

  begin
    insert into public.incense_sticks (memorial_id, lit_by, lit_on) values (target_memorial, visitor, today);
  exception when unique_violation then
    raise exception 'Already lit incense here today' using errcode = 'P0001', hint = 'incense_daily_limit';
  end;

  insert into public.gesture_timers as t (memorial_id, kind, started_at, expires_at)
  values (target_memorial, 'incense', now(), now() + interval '24 hours')
  on conflict (memorial_id, kind) do update
    set started_at = case when t.expires_at <= now() then now() else t.started_at end,
        expires_at = now() + interval '24 hours';

  return query select * from private.incense_state(target_memorial, visitor);
end;
$$;

revoke all on function private.incense_state(uuid, uuid) from public, anon, authenticated;
revoke all on function public.incense_state(uuid) from public, anon, authenticated;
revoke all on function public.light_incense(uuid) from public, anon, authenticated;
grant execute on function public.incense_state(uuid) to anon, authenticated;
grant execute on function public.light_incense(uuid) to authenticated;
