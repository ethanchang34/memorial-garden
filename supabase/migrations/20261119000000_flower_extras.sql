alter table public.flowers
  add column message text
    check (
      char_length(message) between 1 and 140
      and message = btrim(message)
      and message !~ '[\u0001-\u001F\u007F]'
    ),
  add column message_hidden boolean not null default false;

drop function public.place_flower(uuid, text);

create function public.place_flower(target_memorial uuid, chosen_type text, note text default null)
returns table (flower_types text[], bloom_until timestamptz, placed_today boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  visitor uuid := auth.uid();
  today date;
  message text := nullif(btrim(note), '');
begin
  if visitor is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if chosen_type is null or chosen_type not in ('rose', 'tulip', 'daisy', 'poppy') then
    raise exception 'Unknown flower type' using errcode = '22023';
  end if;

  if message is not null and coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean,
    false
  ) then
    raise exception 'Sign in to add a message' using errcode = '42501', hint = 'flower_message_needs_account';
  end if;

  if message is not null and (char_length(message) > 140 or message ~ '[\u0001-\u001F\u007F]') then
    raise exception 'Messages can be up to 140 characters' using errcode = '22023', hint = 'flower_message_invalid';
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
    insert into public.flowers (memorial_id, placed_by, flower_type, placed_on, message)
    values (target_memorial, visitor, chosen_type, today, message);
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

create function public.undo_flower(target_memorial uuid)
returns table (flower_types text[], bloom_until timestamptz, placed_today boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  visitor uuid := auth.uid();
  taken uuid;
begin
  if visitor is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('flowers:' || target_memorial::text, 0));

  select f.id into taken
  from public.flowers f
  where f.memorial_id = target_memorial
    and f.placed_by = visitor
    and f.placed_at > now() - interval '2 minutes'
  order by f.placed_at desc
  limit 1;

  if taken is null then
    raise exception 'Nothing to undo' using errcode = 'P0002', hint = 'flower_undo_expired';
  end if;

  delete from public.flowers where id = taken;

  return query select * from private.flower_state(target_memorial, visitor);
end;
$$;

create function public.flower_credits(target_memorial uuid)
returns table (
  stem integer,
  flower_id uuid,
  flower_type text,
  giver_name text,
  placed_at timestamptz,
  message text,
  message_hidden boolean,
  mine boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select m.id, m.owner_id
    from public.memorials m
    where m.id = target_memorial
      and (m.status = 'published' or (m.owner_id = auth.uid() and m.status = 'draft'))
  ),
  bouquet as (
    select f.*, row_number() over (order by f.placed_at, f.id)::integer as stem
    from public.flowers f
    join public.gesture_timers t on t.memorial_id = f.memorial_id and t.kind = 'flower'
    where f.memorial_id = target_memorial
      and t.expires_at > now()
      and f.placed_at >= t.started_at
  )
  select
    b.stem,
    b.id,
    b.flower_type,
    case when p.status = 'active' and not coalesce(u.is_anonymous, false) then p.display_name end,
    b.placed_at,
    case
      when p.status is distinct from 'active' then null
      when b.message_hidden and target.owner_id is distinct from auth.uid() then null
      else b.message
    end,
    coalesce(b.message_hidden and target.owner_id = auth.uid(), false),
    coalesce(b.placed_by = auth.uid(), false)
  from bouquet b
  cross join target
  left join public.profiles p on p.id = b.placed_by
  left join auth.users u on u.id = b.placed_by
  where b.stem <= 15
  order by b.stem;
$$;

create function public.set_flower_message_hidden(target_flower uuid, hidden boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  update public.flowers f
  set message_hidden = hidden
  from public.memorials m
  where f.id = target_flower
    and m.id = f.memorial_id
    and m.owner_id = auth.uid()
    and f.message is not null;

  if not found then
    raise exception 'Flower not found' using errcode = 'P0002';
  end if;

  return hidden;
end;
$$;

revoke all on function public.place_flower(uuid, text, text) from public, anon, authenticated;
revoke all on function public.undo_flower(uuid) from public, anon, authenticated;
revoke all on function public.flower_credits(uuid) from public, anon, authenticated;
revoke all on function public.set_flower_message_hidden(uuid, boolean) from public, anon, authenticated;
grant execute on function public.place_flower(uuid, text, text) to authenticated;
grant execute on function public.undo_flower(uuid) to authenticated;
grant execute on function public.flower_credits(uuid) to anon, authenticated;
grant execute on function public.set_flower_message_hidden(uuid, boolean) to authenticated;
