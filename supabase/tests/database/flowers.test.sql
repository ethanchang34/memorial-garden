begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(26);

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', '{"full_name": "Owen Owner"}'),
  ('00000000-0000-0000-0000-0000000000a2', '{}'),
  ('00000000-0000-0000-0000-0000000000a3', '{}'),
  ('00000000-0000-0000-0000-0000000000a4', '{}');
update public.profiles set time_zone = 'Pacific/Kiritimati' where id = '00000000-0000-0000-0000-0000000000a3';
update public.profiles set status = 'banned' where id = '00000000-0000-0000-0000-0000000000a4';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "is_anonymous": false}';
insert into public.memorials (owner_id, full_name, died_date, died_precision)
  values ('00000000-0000-0000-0000-0000000000a1', 'Shared One', '2020-01-01', 'year'),
         ('00000000-0000-0000-0000-0000000000a1', 'Draft One', '2021-01-01', 'year');
reset role;
update public.memorials set status = 'published' where full_name = 'Shared One';

create temporary table ids as
  select
    (select id from public.memorials where full_name = 'Shared One') as shared,
    (select id from public.memorials where full_name = 'Draft One') as draft;
grant select on ids to anon, authenticated;

select ok(has_function_privilege('anon', 'public.flower_state(uuid)', 'execute'), 'visitors can read flower state');
select ok(has_function_privilege('authenticated', 'public.flower_state(uuid)', 'execute'), 'signed-in users can read flower state');
select ok(has_function_privilege('authenticated', 'public.place_flower(uuid, text, text)', 'execute'), 'signed-in users can place flowers');
select ok(not has_function_privilege('anon', 'public.place_flower(uuid, text, text)', 'execute'), 'signed-out visitors cannot place flowers');
select ok(not has_function_privilege('authenticated', 'private.flower_state(uuid, uuid)', 'execute'), 'the internal state function is private');
select ok(has_table_privilege('authenticated', 'public.flowers', 'select'), 'visitors can read their own flowers');
select ok(not has_table_privilege('authenticated', 'public.flowers', 'insert'), 'flowers are only placed through place_flower');

set local request.jwt.claim.sub = '';
set local request.jwt.claims = '';
set local role anon;
select results_eq(
  $$select flower_types, bloom_until, placed_today from public.flower_state((select shared from ids))$$,
  $$values ('{}'::text[], null::timestamptz, false)$$,
  'an untouched garden has no flowers'
);
select is(
  (select count(*)::int from public.flower_state((select draft from ids))),
  0,
  'drafts reveal nothing to visitors'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated", "is_anonymous": true}';
select throws_ok(
  $$select * from public.place_flower((select shared from ids), 'cactus')$$,
  '22023', 'Unknown flower type', 'only known flower types can be placed'
);
select results_eq(
  $$select flower_types, bloom_until = now() + interval '14 days', placed_today from public.place_flower((select shared from ids), 'tulip')$$,
  $$values ('{tulip}'::text[], true, true)$$,
  'an anonymous visitor places the first flower for fourteen days'
);
select throws_ok(
  $$select * from public.place_flower((select shared from ids), 'rose')$$,
  'P0001', 'Already placed a flower here today', 'one flower per visitor per memorial per day'
);
select throws_ok(
  $$select * from public.place_flower((select draft from ids), 'rose')$$,
  'P0002', 'Memorial not found', 'drafts cannot get flowers'
);
select throws_ok(
  $$insert into public.flowers (memorial_id, placed_by, flower_type, placed_on) values ((select shared from ids), '00000000-0000-0000-0000-0000000000a2', 'rose', current_date + 1)$$,
  '42501', null, 'visitors cannot insert flowers directly'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a3", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select flower_types, placed_today from public.place_flower((select shared from ids), 'daisy')$$,
  $$values ('{tulip,daisy}'::text[], true)$$,
  'a second visitor adds a different flower in order'
);
select is(
  (select count(*)::int from public.flowers),
  1,
  'visitors see only their own flowers'
);
reset role;

set local request.jwt.claim.sub = '';
set local request.jwt.claims = '';
set local role anon;
select results_eq(
  $$select placed_today from public.flower_state((select shared from ids))$$,
  $$values (false)$$,
  'a signed-out visitor has not placed a flower today'
);
reset role;

select is(
  (select placed_on from public.flowers where placed_by = '00000000-0000-0000-0000-0000000000a3'),
  (now() at time zone 'Pacific/Kiritimati')::date,
  'the day is the visitor''s local day'
);

update public.flowers set placed_on = placed_on - 1 where placed_by = '00000000-0000-0000-0000-0000000000a2';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select cardinality(flower_types) from public.place_flower((select shared from ids), 'poppy')$$,
  $$values (3)$$,
  'the same visitor can place another flower the next day'
);
reset role;

insert into public.flowers (memorial_id, placed_by, flower_type, placed_on)
  select (select shared from ids), null, 'rose', current_date from generate_series(1, 20);
select results_eq(
  $$select cardinality(flower_types), flower_types[1:3] from public.flower_state((select shared from ids))$$,
  $$values (15, '{tulip,daisy,poppy}'::text[])$$,
  'the vases hold at most 15 stems, oldest first'
);

update public.flowers set placed_on = placed_on - 1 where placed_by = '00000000-0000-0000-0000-0000000000a3';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a3", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select cardinality(flower_types), bloom_until = now() + interval '14 days' from public.place_flower((select shared from ids), 'daisy')$$,
  $$values (15, true)$$,
  'when the vases are full a new flower only refreshes the bloom'
);
reset role;

update public.gesture_timers set started_at = now() - interval '20 days', expires_at = now() - interval '1 day';
update public.flowers set placed_at = now() - interval '15 days';
select results_eq(
  $$select flower_types, bloom_until from public.flower_state((select shared from ids))$$,
  $$values ('{}'::text[], null::timestamptz)$$,
  'flowers fade when the shared timer runs out'
);

update public.flowers set placed_on = placed_on - 1 where placed_by = '00000000-0000-0000-0000-0000000000a2';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select flower_types from public.place_flower((select shared from ids), 'rose')$$,
  $$values ('{rose}'::text[])$$,
  'placing after the flowers faded starts a fresh bouquet'
);
reset role;

select is(
  (select count(*)::int from public.gesture_timers where kind = 'flower'),
  1,
  'flowers share one timer per memorial'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a4';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a4", "role": "authenticated", "is_anonymous": true}';
select throws_ok(
  $$select * from public.place_flower((select shared from ids), 'rose')$$,
  '42501', 'Visitor not allowed', 'banned visitors cannot place flowers'
);
reset role;

select throws_ok(
  $$insert into public.gesture_timers (memorial_id, kind, started_at, expires_at) values ((select shared from ids), 'lantern', now(), now() + interval '1 day')$$,
  '23514', null, 'timers only exist for known gestures'
);

select * from finish();
rollback;
