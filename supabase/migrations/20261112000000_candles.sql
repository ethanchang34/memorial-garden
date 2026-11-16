create table public.candles (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  lit_by uuid references public.profiles (id) on delete set null,
  lit_on date not null,
  lit_at timestamptz not null default now()
);

create unique index candles_once_a_day on public.candles (memorial_id, lit_by, lit_on);
create index candles_memorial_idx on public.candles (memorial_id, lit_at desc);

create table public.gesture_timers (
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  kind text not null check (kind in ('candle')),
  started_at timestamptz not null,
  expires_at timestamptz not null,
  primary key (memorial_id, kind),
  constraint gesture_timers_order check (expires_at > started_at)
);

alter table public.candles enable row level security;
alter table public.gesture_timers enable row level security;

revoke all on public.candles from public, anon, authenticated;
revoke all on public.gesture_timers from public, anon, authenticated;
grant select on public.candles to authenticated;
grant select on public.gesture_timers to anon, authenticated;

create policy "Visitors see the candles they lit"
  on public.candles for select
  to authenticated
  using ((select auth.uid()) = lit_by);

create policy "Anyone can see timers on shared memorials"
  on public.gesture_timers for select
  to anon, authenticated
  using (exists (select 1 from public.memorials m where m.id = memorial_id and m.status = 'published'));

create function private.candle_state(target_memorial uuid, viewer uuid)
returns table (lit_count integer, lit_until timestamptz, lit_today boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when t.expires_at > now() then least(
        15,
        (select count(*) from public.candles c where c.memorial_id = target_memorial and c.lit_at >= t.started_at)
      )::integer
      else 0
    end,
    case when t.expires_at > now() then t.expires_at end,
    viewer is not null and exists (
      select 1
      from public.candles c
      join public.profiles p on p.id = viewer
      where c.memorial_id = target_memorial
        and c.lit_by = viewer
        and c.lit_on = (now() at time zone p.time_zone)::date
    )
  from (select 1) as one
  left join public.gesture_timers t on t.memorial_id = target_memorial and t.kind = 'candle';
$$;

create function public.candle_state(target_memorial uuid)
returns table (lit_count integer, lit_until timestamptz, lit_today boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select s.*
  from private.candle_state(target_memorial, auth.uid()) as s
  where exists (
    select 1 from public.memorials m
    where m.id = target_memorial
      and (m.status = 'published' or (m.owner_id = auth.uid() and m.status = 'draft'))
  );
$$;

create function public.light_candle(target_memorial uuid)
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

  perform pg_advisory_xact_lock(hashtextextended('candles:' || target_memorial::text, 0));

  begin
    insert into public.candles (memorial_id, lit_by, lit_on) values (target_memorial, visitor, today);
  exception when unique_violation then
    raise exception 'Already lit a candle here today' using errcode = 'P0001', hint = 'candle_daily_limit';
  end;

  insert into public.gesture_timers as t (memorial_id, kind, started_at, expires_at)
  values (target_memorial, 'candle', now(), now() + interval '3 days')
  on conflict (memorial_id, kind) do update
    set started_at = case when t.expires_at <= now() then now() else t.started_at end,
        expires_at = now() + interval '3 days';

  return query select * from private.candle_state(target_memorial, visitor);
end;
$$;

revoke all on function private.candle_state(uuid, uuid) from public, anon, authenticated;
revoke all on function public.candle_state(uuid) from public, anon, authenticated;
revoke all on function public.light_candle(uuid) from public, anon, authenticated;
grant execute on function public.candle_state(uuid) to anon, authenticated;
grant execute on function public.light_candle(uuid) to authenticated;
