alter table public.gesture_timers drop constraint gesture_timers_kind_check;
alter table public.gesture_timers add constraint gesture_timers_kind_check check (kind in ('candle', 'flower'));

create table public.flowers (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  placed_by uuid references public.profiles (id) on delete set null,
  flower_type text not null check (flower_type in ('rose', 'tulip', 'daisy', 'poppy')),
  placed_on date not null,
  placed_at timestamptz not null default clock_timestamp()
);

create unique index flowers_once_a_day on public.flowers (memorial_id, placed_by, placed_on);
create index flowers_memorial_idx on public.flowers (memorial_id, placed_at);

alter table public.flowers enable row level security;

revoke all on public.flowers from public, anon, authenticated;
grant select on public.flowers to authenticated;

create policy "Visitors see the flowers they placed"
  on public.flowers for select
  to authenticated
  using ((select auth.uid()) = placed_by);

create function private.flower_state(target_memorial uuid, viewer uuid)
returns table (flower_types text[], bloom_until timestamptz, placed_today boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when t.expires_at > now() then coalesce((
        select array_agg(f.flower_type order by f.placed_at, f.id)
        from (
          select f.flower_type, f.placed_at, f.id
          from public.flowers f
          where f.memorial_id = target_memorial and f.placed_at >= t.started_at
          order by f.placed_at, f.id
          limit 15
        ) as f
      ), '{}')
      else '{}'
    end,
    case when t.expires_at > now() then t.expires_at end,
    viewer is not null and exists (
      select 1
      from public.flowers f
      join public.profiles p on p.id = viewer
      where f.memorial_id = target_memorial
        and f.placed_by = viewer
        and f.placed_on = (now() at time zone p.time_zone)::date
    )
  from (select 1) as one
  left join public.gesture_timers t on t.memorial_id = target_memorial and t.kind = 'flower';
$$;

create function public.flower_state(target_memorial uuid)
returns table (flower_types text[], bloom_until timestamptz, placed_today boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select s.*
  from private.flower_state(target_memorial, auth.uid()) as s
  where exists (
    select 1 from public.memorials m
    where m.id = target_memorial
      and (m.status = 'published' or (m.owner_id = auth.uid() and m.status = 'draft'))
  );
$$;

create function public.place_flower(target_memorial uuid, chosen_type text)
returns table (flower_types text[], bloom_until timestamptz, placed_today boolean)
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

  if chosen_type is null or chosen_type not in ('rose', 'tulip', 'daisy', 'poppy') then
    raise exception 'Unknown flower type' using errcode = '22023';
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

  perform pg_advisory_xact_lock(hashtextextended('flowers:' || target_memorial::text, 0));

  begin
    insert into public.flowers (memorial_id, placed_by, flower_type, placed_on)
    values (target_memorial, visitor, chosen_type, today);
  exception when unique_violation then
    raise exception 'Already placed a flower here today' using errcode = 'P0001', hint = 'flower_daily_limit';
  end;

  insert into public.gesture_timers as t (memorial_id, kind, started_at, expires_at)
  values (target_memorial, 'flower', now(), now() + interval '14 days')
  on conflict (memorial_id, kind) do update
    set started_at = case when t.expires_at <= now() then now() else t.started_at end,
        expires_at = now() + interval '14 days';

  return query select * from private.flower_state(target_memorial, visitor);
end;
$$;

revoke all on function private.flower_state(uuid, uuid) from public, anon, authenticated;
revoke all on function public.flower_state(uuid) from public, anon, authenticated;
revoke all on function public.place_flower(uuid, text) from public, anon, authenticated;
grant execute on function public.flower_state(uuid) to anon, authenticated;
grant execute on function public.place_flower(uuid, text) to authenticated;
