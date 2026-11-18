begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(25);

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', '{"full_name": "Owen Owner"}'),
  ('00000000-0000-0000-0000-0000000000e2', '{}'),
  ('00000000-0000-0000-0000-0000000000e3', '{}'),
  ('00000000-0000-0000-0000-0000000000e4', '{}');
update public.profiles set time_zone = 'Pacific/Kiritimati' where id = '00000000-0000-0000-0000-0000000000e3';
update public.profiles set status = 'banned' where id = '00000000-0000-0000-0000-0000000000e4';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e1", "role": "authenticated", "is_anonymous": false}';
insert into public.memorials (owner_id, full_name, died_date, died_precision)
  values ('00000000-0000-0000-0000-0000000000e1', 'Shared One', '2020-01-01', 'year'),
         ('00000000-0000-0000-0000-0000000000e1', 'Draft One', '2021-01-01', 'year');
reset role;
update public.memorials set status = 'published' where full_name = 'Shared One';

create temporary table ids as
  select
    (select id from public.memorials where full_name = 'Shared One') as shared,
    (select id from public.memorials where full_name = 'Draft One') as draft;
grant select on ids to anon, authenticated;

select ok(has_function_privilege('anon', 'public.incense_state(uuid)', 'execute'), 'visitors can read incense state');
select ok(has_function_privilege('authenticated', 'public.incense_state(uuid)', 'execute'), 'signed-in users can read incense state');
select ok(has_function_privilege('authenticated', 'public.light_incense(uuid)', 'execute'), 'signed-in users can light incense');
select ok(not has_function_privilege('anon', 'public.light_incense(uuid)', 'execute'), 'signed-out visitors cannot light incense');
select ok(not has_function_privilege('authenticated', 'private.incense_state(uuid, uuid)', 'execute'), 'the internal state function is private');
select ok(has_table_privilege('authenticated', 'public.incense_sticks', 'select'), 'visitors can read their own incense');
select ok(not has_table_privilege('authenticated', 'public.incense_sticks', 'insert'), 'incense is only lit through light_incense');
select ok(has_table_privilege('anon', 'public.gesture_timers', 'select'), 'anyone can read gesture timers');
select ok(not has_table_privilege('authenticated', 'public.gesture_timers', 'update'), 'timers change only through gestures');
select lives_ok(
  $$insert into public.gesture_timers (memorial_id, kind, started_at, expires_at) values ((select shared from ids), 'incense', now() - interval '1 day', now() - interval '23 hours')$$,
  'incense has its own timer kind'
);
delete from public.gesture_timers where kind = 'incense';

set local request.jwt.claim.sub = '';
set local request.jwt.claims = '';
set local role anon;
select results_eq(
  $$select lit_count, lit_until, lit_today from public.incense_state((select shared from ids))$$,
  $$values (0, null::timestamptz, false)$$,
  'an untouched garden has no incense burning'
);
select is(
  (select count(*)::int from public.incense_state((select draft from ids))),
  0,
  'drafts reveal nothing to visitors'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e2", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select lit_count, lit_until = now() + interval '24 hours', lit_today from public.light_incense((select shared from ids))$$,
  $$values (1, true, true)$$,
  'an anonymous visitor lights the first stick for a day'
);
select throws_ok(
  $$select * from public.light_incense((select shared from ids))$$,
  'P0001', 'Already lit incense here today', 'one stick per visitor per memorial per day'
);
select throws_ok(
  $$select * from public.light_incense((select draft from ids))$$,
  'P0002', 'Memorial not found', 'drafts cannot get incense'
);
select throws_ok(
  $$insert into public.incense_sticks (memorial_id, lit_by, lit_on) values ((select shared from ids), '00000000-0000-0000-0000-0000000000e2', current_date + 1)$$,
  '42501', null, 'visitors cannot insert incense directly'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e3", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select lit_count, lit_today from public.light_incense((select shared from ids))$$,
  $$values (2, true)$$,
  'a second visitor adds a stick'
);
select is(
  (select count(*)::int from public.incense_sticks),
  1,
  'visitors see only their own incense'
);
reset role;

select is(
  (select lit_on from public.incense_sticks where lit_by = '00000000-0000-0000-0000-0000000000e3'),
  (now() at time zone 'Pacific/Kiritimati')::date,
  'the day is the visitor''s local day'
);

update public.incense_sticks set lit_on = lit_on - 1 where lit_by = '00000000-0000-0000-0000-0000000000e2';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e2", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select lit_count from public.light_incense((select shared from ids))$$,
  $$values (3)$$,
  'the same visitor can light again the next day'
);
reset role;

insert into public.incense_sticks (memorial_id, lit_by, lit_on)
  select (select shared from ids), null, current_date from generate_series(1, 5);
select results_eq(
  $$select lit_count from public.incense_state((select shared from ids))$$,
  $$values (3)$$,
  'the holder shows at most 3 sticks'
);

update public.gesture_timers set started_at = now() - interval '2 days', expires_at = now() - interval '1 hour' where kind = 'incense';
update public.incense_sticks set lit_at = now() - interval '30 hours';
select results_eq(
  $$select lit_count, lit_until from public.incense_state((select shared from ids))$$,
  $$values (0, null::timestamptz)$$,
  'the incense burns out when the shared timer runs out'
);

update public.incense_sticks set lit_on = lit_on - 1 where lit_by = '00000000-0000-0000-0000-0000000000e3';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e3", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select lit_count from public.light_incense((select shared from ids))$$,
  $$values (1)$$,
  'lighting after it burned out starts fresh'
);
reset role;

update public.gesture_timers set expires_at = now() + interval '1 hour' where kind = 'incense';
update public.incense_sticks set lit_on = lit_on - 1 where lit_by = '00000000-0000-0000-0000-0000000000e2';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e2", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select lit_until = now() + interval '24 hours' from public.light_incense((select shared from ids))$$,
  $$values (true)$$,
  'a new stick keeps every stick burning'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e4';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e4", "role": "authenticated", "is_anonymous": true}';
select throws_ok(
  $$select * from public.light_incense((select shared from ids))$$,
  '42501', 'Visitor not allowed', 'banned visitors cannot light incense'
);
reset role;

select * from finish();
rollback;
