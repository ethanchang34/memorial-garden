begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(23);

insert into auth.users (id, raw_user_meta_data, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000c1', '{"full_name": "Owen Owner"}', false),
  ('00000000-0000-0000-0000-0000000000c2', '{"full_name": "Alex Visitor"}', false),
  ('00000000-0000-0000-0000-0000000000c3', '{}', true),
  ('00000000-0000-0000-0000-0000000000c4', '{"full_name": "Bad Actor"}', false);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated", "is_anonymous": false}';
insert into public.memorials (owner_id, full_name, died_date, died_precision)
  values ('00000000-0000-0000-0000-0000000000c1', 'Shared One', '2020-01-01', 'year');
reset role;
update public.memorials set status = 'published' where full_name = 'Shared One';

create temporary table ids as select (select id from public.memorials where full_name = 'Shared One') as shared;
grant select on ids to anon, authenticated;

select ok(has_function_privilege('authenticated', 'public.place_flower(uuid, text, text)', 'execute'), 'visitors can place flowers with a message');
select ok(not has_function_privilege('anon', 'public.place_flower(uuid, text, text)', 'execute'), 'signed-out visitors cannot place flowers');
select ok(has_function_privilege('authenticated', 'public.undo_flower(uuid)', 'execute'), 'visitors can take a flower back');
select ok(not has_function_privilege('anon', 'public.undo_flower(uuid)', 'execute'), 'signed-out visitors cannot undo');
select ok(has_function_privilege('anon', 'public.flower_credits(uuid)', 'execute'), 'anyone can see who left flowers');
select ok(has_function_privilege('authenticated', 'public.set_flower_message_hidden(uuid, boolean)', 'execute'), 'owners can hide messages');
select ok(not has_function_privilege('anon', 'public.set_flower_message_hidden(uuid, boolean)', 'execute'), 'signed-out visitors cannot hide messages');
select ok(not has_column_privilege('authenticated', 'public.flowers', 'message_hidden', 'update'), 'hiding goes only through the function');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c3", "role": "authenticated", "is_anonymous": true}';
select throws_ok(
  $$select * from public.place_flower((select shared from ids), 'rose', 'Hello')$$,
  '42501', 'Sign in to add a message', 'anonymous visitors cannot attach a message'
);
select lives_ok(
  $$select * from public.place_flower((select shared from ids), 'rose', '   ')$$,
  'a blank message from an anonymous visitor is just a flower'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c2", "role": "authenticated", "is_anonymous": false}';
select throws_ok(
  $$select * from public.place_flower((select shared from ids), 'tulip', repeat('a', 141))$$,
  '22023', 'Messages can be up to 140 characters', 'messages have a length limit'
);
select throws_ok(
  $$select * from public.place_flower((select shared from ids), 'tulip', E'bell\u0007')$$,
  '22023', 'Messages can be up to 140 characters', 'messages reject control characters'
);
select results_eq(
  $$select flower_types from public.place_flower((select shared from ids), 'tulip', '  Miss you, Rosa  ')$$,
  $$values ('{rose,tulip}'::text[])$$,
  'a member places a flower with a trimmed message'
);
select results_eq(
  $$select stem, flower_type, giver_name, message, mine from public.flower_credits((select shared from ids))$$,
  $$values (1, 'rose', null::text, null::text, false), (2, 'tulip', 'Alex V.', 'Miss you, Rosa', true)$$,
  'credits name members, keep anonymous visitors anonymous, and mark your own'
);
select results_eq(
  $$select flower_types, placed_today from public.undo_flower((select shared from ids))$$,
  $$values ('{rose}'::text[], false)$$,
  'a visitor takes their flower back right away'
);
select lives_ok(
  $$select * from public.place_flower((select shared from ids), 'poppy', 'Miss you, Rosa')$$,
  'after undoing, the visitor can choose again today'
);
reset role;

update public.gesture_timers set started_at = now() - interval '1 hour' where kind = 'flower';
update public.flowers set placed_at = now() - interval '5 minutes' where placed_by = '00000000-0000-0000-0000-0000000000c2';
create temporary table poppy as select id from public.flowers where flower_type = 'poppy';
grant select on poppy to anon, authenticated;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c2", "role": "authenticated", "is_anonymous": false}';
select throws_ok(
  $$select * from public.undo_flower((select shared from ids))$$,
  'P0002', 'Nothing to undo', 'undo only works for a moment'
);
select throws_ok(
  $$select public.set_flower_message_hidden((select id from poppy), true)$$,
  'P0002', 'Flower not found', 'only the owner can hide a message'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated", "is_anonymous": false}';
select is(
  public.set_flower_message_hidden((select id from poppy), true),
  true,
  'the owner hides a message'
);
select results_eq(
  $$select message, message_hidden from public.flower_credits((select shared from ids)) where flower_type = 'poppy'$$,
  $$values ('Miss you, Rosa'::text, true)$$,
  'the owner still sees a hidden message, marked hidden'
);
reset role;

set local request.jwt.claim.sub = '';
set local request.jwt.claims = '';
set local role anon;
select results_eq(
  $$select giver_name, message, message_hidden from public.flower_credits((select shared from ids)) where flower_type = 'poppy'$$,
  $$values ('Alex V.'::text, null::text, false)$$,
  'visitors no longer see a hidden message'
);
select is(
  (select bool_or(mine) from public.flower_credits((select shared from ids))),
  false,
  'nothing is marked as a signed-out visitor''s own'
);
reset role;

update public.profiles set status = 'banned' where id = '00000000-0000-0000-0000-0000000000c2';
update public.flowers set message_hidden = false;
set local role anon;
select results_eq(
  $$select giver_name, message from public.flower_credits((select shared from ids)) where flower_type = 'poppy'$$,
  $$values (null::text, null::text)$$,
  'a banned member''s name and message disappear'
);
reset role;

select * from finish();
rollback;
