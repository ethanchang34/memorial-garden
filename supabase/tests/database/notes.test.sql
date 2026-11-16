begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(33);

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', '{"full_name": "Owen Owner"}'),
  ('00000000-0000-0000-0000-0000000000a2', '{"full_name": "Wren Writer"}'),
  ('00000000-0000-0000-0000-0000000000a3', '{"full_name": "Nina Newcomer"}'),
  ('00000000-0000-0000-0000-0000000000a4', '{}'),
  ('00000000-0000-0000-0000-0000000000a5', '{"full_name": "Bo Banned"}');
update public.profiles set created_at = now() - interval '30 days'
  where id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a5');
update public.profiles set status = 'banned' where id = '00000000-0000-0000-0000-0000000000a5';

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

select ok(has_table_privilege('anon', 'public.notes', 'select'), 'visitors can read notes');
select ok(not has_table_privilege('anon', 'public.notes', 'insert'), 'signed-out visitors cannot write notes');
select ok(has_column_privilege('authenticated', 'public.notes', 'body', 'insert'), 'members can write a note body');
select ok(not has_column_privilege('authenticated', 'public.notes', 'status', 'insert'), 'members cannot pick a status');
select ok(has_column_privilege('authenticated', 'public.notes', 'body', 'update'), 'authors can edit the body');
select ok(not has_column_privilege('authenticated', 'public.notes', 'status', 'update'), 'status changes only through set_note_hidden');
select ok(not has_column_privilege('authenticated', 'public.notes', 'author_id', 'update'), 'authors cannot reassign notes');
select ok(has_table_privilege('authenticated', 'public.notes', 'delete'), 'authors can delete');
select ok(has_function_privilege('authenticated', 'public.set_note_hidden(uuid, boolean)', 'execute'), 'owners can hide notes');
select ok(not has_function_privilege('anon', 'public.set_note_hidden(uuid, boolean)', 'execute'), 'visitors cannot hide notes');
select ok(not has_function_privilege('authenticated', 'private.is_anonymous()', 'execute'), 'the helper stays private');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated", "is_anonymous": false}';
select lives_ok(
  $$insert into public.notes (memorial_id, author_id, body) values ((select shared from ids), '00000000-0000-0000-0000-0000000000a2', 'We miss you.')$$,
  'a member writes a note on a shared memorial'
);
select results_eq(
  $$select status, edited_at is null from public.notes$$,
  $$values ('visible', true)$$,
  'new notes are visible and unedited'
);
select throws_ok(
  $$insert into public.notes (memorial_id, author_id, body) values ((select shared from ids), '00000000-0000-0000-0000-0000000000a1', 'Pretending')$$,
  '42501', null, 'members cannot write as someone else'
);
select throws_ok(
  $$insert into public.notes (memorial_id, author_id, body) values ((select draft from ids), '00000000-0000-0000-0000-0000000000a2', 'Early')$$,
  'P0002', 'Memorial not found', 'other people''s drafts take no notes'
);
select throws_ok(
  $$insert into public.notes (memorial_id, author_id, body) values ((select shared from ids), '00000000-0000-0000-0000-0000000000a2', '  padded  ')$$,
  '23514', null, 'note bodies are trimmed'
);
select throws_ok(
  $$insert into public.notes (memorial_id, author_id, body) values ((select shared from ids), '00000000-0000-0000-0000-0000000000a2', repeat('a', 2001))$$,
  '23514', null, 'notes are at most 2000 characters'
);
select lives_ok(
  $$update public.notes set body = 'We miss you every day.' where author_id = '00000000-0000-0000-0000-0000000000a2'$$,
  'the author edits their note'
);
select is(
  (select edited_at is not null from public.notes where author_id = '00000000-0000-0000-0000-0000000000a2'),
  true,
  'an edit sets edited_at'
);
select lives_ok(
  $$insert into public.notes (memorial_id, author_id, body)
    select (select shared from ids), '00000000-0000-0000-0000-0000000000a2', 'Note ' || n from generate_series(2, 10) as n$$,
  'up to 10 notes an hour'
);
select throws_ok(
  $$insert into public.notes (memorial_id, author_id, body) values ((select shared from ids), '00000000-0000-0000-0000-0000000000a2', 'One more')$$,
  'P0001', 'At most 10 notes an hour', 'the eleventh note in an hour is refused'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a3", "role": "authenticated", "is_anonymous": false}';
select lives_ok(
  $$insert into public.notes (memorial_id, author_id, body)
    select (select shared from ids), '00000000-0000-0000-0000-0000000000a3', 'Hello ' || n from generate_series(1, 5) as n$$,
  'a new account writes 5 notes'
);
select throws_ok(
  $$insert into public.notes (memorial_id, author_id, body) values ((select shared from ids), '00000000-0000-0000-0000-0000000000a3', 'Sixth')$$,
  'P0001', 'New accounts can write 5 notes in their first day', 'new accounts get 5 notes on their first day'
);
select is(
  (select count(*)::int from public.notes where author_id = '00000000-0000-0000-0000-0000000000a2' and body = 'Note 2'),
  1,
  'members read other people''s visible notes'
);
select lives_ok(
  $$update public.notes set body = 'Hijacked' where author_id = '00000000-0000-0000-0000-0000000000a2'$$,
  'editing someone else''s note runs but matches nothing'
);
select throws_ok(
  $$select public.set_note_hidden((select id from public.notes where body = 'Note 2'), true)$$,
  'P0002', 'Note not found', 'only the owner can hide notes'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a4';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a4", "role": "authenticated", "is_anonymous": true}';
select throws_ok(
  $$insert into public.notes (memorial_id, author_id, body) values ((select shared from ids), '00000000-0000-0000-0000-0000000000a4', 'Drive-by')$$,
  '42501', null, 'anonymous visitors cannot write notes'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a5';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a5", "role": "authenticated", "is_anonymous": false}';
select throws_ok(
  $$insert into public.notes (memorial_id, author_id, body) values ((select shared from ids), '00000000-0000-0000-0000-0000000000a5', 'Back again')$$,
  '42501', 'Member not allowed', 'banned members cannot write notes'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "is_anonymous": false}';
select is(
  public.set_note_hidden((select id from public.notes where body = 'Note 2'), true),
  'hidden_by_owner',
  'the owner hides a note'
);
reset role;

set local request.jwt.claim.sub = '';
set local request.jwt.claims = '';
set local role anon;
select is(
  (select count(*)::int from public.notes where body = 'Note 2'),
  0,
  'hidden notes disappear for visitors'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a2", "role": "authenticated", "is_anonymous": false}';
select results_eq(
  $$select status from public.notes where body = 'Note 2'$$,
  $$values ('hidden_by_owner')$$,
  'the author still sees their hidden note'
);
select lives_ok(
  $$delete from public.notes where body = 'Note 3'$$,
  'the author deletes a note'
);
reset role;

select is(
  (select count(*)::int from public.notes where body in ('Note 3', 'Hijacked')),
  0,
  'the note is gone and nothing was hijacked'
);

select * from finish();
rollback;
