begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(24);

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', '{"full_name": "Owen Owner"}'),
  ('00000000-0000-0000-0000-0000000000f2', '{}'),
  ('00000000-0000-0000-0000-0000000000f3', '{}'),
  ('00000000-0000-0000-0000-0000000000f4', '{}');
update public.profiles set time_zone = 'Pacific/Kiritimati' where id = '00000000-0000-0000-0000-0000000000f3';
update public.profiles set status = 'banned' where id = '00000000-0000-0000-0000-0000000000f4';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f1", "role": "authenticated", "is_anonymous": false}';
insert into public.memorials (owner_id, full_name, died_date, died_precision)
  values ('00000000-0000-0000-0000-0000000000f1', 'Shared One', '2020-01-01', 'year'),
         ('00000000-0000-0000-0000-0000000000f1', 'Draft One', '2021-01-01', 'year');
reset role;
update public.memorials set status = 'published' where full_name = 'Shared One';

create temporary table ids as
  select
    (select id from public.memorials where full_name = 'Shared One') as shared,
    (select id from public.memorials where full_name = 'Draft One') as draft;
grant select on ids to anon, authenticated;

select ok(has_function_privilege('anon', 'public.candle_state(uuid)', 'execute'), 'visitors can read candle state');
select ok(has_function_privilege('authenticated', 'public.candle_state(uuid)', 'execute'), 'signed-in users can read candle state');
select ok(has_function_privilege('authenticated', 'public.light_candle(uuid)', 'execute'), 'signed-in users can light candles');
select ok(not has_function_privilege('anon', 'public.light_candle(uuid)', 'execute'), 'signed-out visitors cannot light candles');
select ok(not has_function_privilege('authenticated', 'private.candle_state(uuid, uuid)', 'execute'), 'the internal state function is private');
select ok(has_table_privilege('authenticated', 'public.candles', 'select'), 'visitors can read their own candles');
select ok(not has_table_privilege('authenticated', 'public.candles', 'insert'), 'candles are only lit through light_candle');
select ok(has_table_privilege('anon', 'public.gesture_timers', 'select'), 'anyone can read gesture timers');
select ok(not has_table_privilege('authenticated', 'public.gesture_timers', 'update'), 'timers change only through gestures');

set local request.jwt.claim.sub = '';
set local request.jwt.claims = '';
set local role anon;
select results_eq(
  $$select lit_count, lit_until, lit_today from public.candle_state((select shared from ids))$$,
  $$values (0, null::timestamptz, false)$$,
  'an untouched garden has no lit candles'
);
select is(
  (select count(*)::int from public.candle_state((select draft from ids))),
  0,
  'drafts reveal nothing to visitors'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f2", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select lit_count, lit_until = now() + interval '3 days', lit_today from public.light_candle((select shared from ids))$$,
  $$values (1, true, true)$$,
  'an anonymous visitor lights the first candle for three days'
);
select throws_ok(
  $$select * from public.light_candle((select shared from ids))$$,
  'P0001', 'Already lit a candle here today', 'one candle per visitor per memorial per day'
);
select throws_ok(
  $$select * from public.light_candle((select draft from ids))$$,
  'P0002', 'Memorial not found', 'drafts cannot get candles'
);
select throws_ok(
  $$insert into public.candles (memorial_id, lit_by, lit_on) values ((select shared from ids), '00000000-0000-0000-0000-0000000000f2', current_date + 1)$$,
  '42501', null, 'visitors cannot insert candles directly'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f3", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select lit_count, lit_today from public.light_candle((select shared from ids))$$,
  $$values (2, true)$$,
  'a second visitor adds to the cluster'
);
select is(
  (select count(*)::int from public.candles),
  1,
  'visitors see only their own candles'
);
reset role;

select is(
  (select lit_on from public.candles where lit_by = '00000000-0000-0000-0000-0000000000f3'),
  (now() at time zone 'Pacific/Kiritimati')::date,
  'the day is the visitor''s local day'
);

update public.candles set lit_on = lit_on - 1 where lit_by = '00000000-0000-0000-0000-0000000000f2';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f2", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select lit_count from public.light_candle((select shared from ids))$$,
  $$values (3)$$,
  'the same visitor can light again the next day'
);
reset role;

insert into public.candles (memorial_id, lit_by, lit_on)
  select (select shared from ids), null, current_date from generate_series(1, 20);
select results_eq(
  $$select lit_count from public.candle_state((select shared from ids))$$,
  $$values (15)$$,
  'the cluster shows at most 15 candles'
);

update public.gesture_timers set started_at = now() - interval '5 days', expires_at = now() - interval '1 day';
update public.candles set lit_at = now() - interval '4 days';
select results_eq(
  $$select lit_count, lit_until from public.candle_state((select shared from ids))$$,
  $$values (0, null::timestamptz)$$,
  'candles go out when the shared timer runs out'
);

update public.candles set lit_on = lit_on - 1 where lit_by = '00000000-0000-0000-0000-0000000000f3';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f3", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select lit_count from public.light_candle((select shared from ids))$$,
  $$values (1)$$,
  'lighting after the timer ran out starts a new cluster'
);
reset role;

update public.gesture_timers set expires_at = now() + interval '1 hour';
update public.candles set lit_on = lit_on - 1 where lit_by = '00000000-0000-0000-0000-0000000000f2';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f2", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select lit_until = now() + interval '3 days' from public.light_candle((select shared from ids))$$,
  $$values (true)$$,
  'a new candle refreshes the timer for the whole cluster'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000f4';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000f4", "role": "authenticated", "is_anonymous": true}';
select throws_ok(
  $$select * from public.light_candle((select shared from ids))$$,
  '42501', 'Visitor not allowed', 'banned visitors cannot light candles'
);
reset role;

select * from finish();
rollback;
