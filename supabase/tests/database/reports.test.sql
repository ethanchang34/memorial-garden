begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(17);

insert into auth.users (id, raw_user_meta_data, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000d1', '{"full_name": "Owen Owner"}', false),
  ('00000000-0000-0000-0000-0000000000d2', '{"full_name": "Rae Reporter"}', false),
  ('00000000-0000-0000-0000-0000000000d3', '{}', true),
  ('00000000-0000-0000-0000-0000000000d4', '{"full_name": "Ada Admin"}', false),
  ('00000000-0000-0000-0000-0000000000d5', '{"full_name": "Wren Writer"}', false);
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-0000000000d4';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d1", "role": "authenticated", "is_anonymous": false}';
insert into public.memorials (owner_id, full_name, died_date, died_precision)
  values ('00000000-0000-0000-0000-0000000000d1', 'Shared One', '2020-01-01', 'year');
reset role;
update public.memorials set status = 'published' where full_name = 'Shared One';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d5';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d5", "role": "authenticated", "is_anonymous": false}';
insert into public.notes (memorial_id, author_id, body)
  select id, '00000000-0000-0000-0000-0000000000d5', 'Something unkind' from public.memorials where full_name = 'Shared One';
insert into public.notes (memorial_id, author_id, body)
  select id, '00000000-0000-0000-0000-0000000000d5', 'Another one' from public.memorials where full_name = 'Shared One';
reset role;

create temporary table ids as
  select
    (select id from public.notes where body = 'Something unkind') as unkind,
    (select id from public.notes where body = 'Another one') as another;
grant select on ids to anon, authenticated;

select ok(has_function_privilege('authenticated', 'public.report_content(text, uuid, text, text)', 'execute'), 'members can report');
select ok(not has_function_privilege('anon', 'public.report_content(text, uuid, text, text)', 'execute'), 'signed-out visitors cannot report');
select ok(not has_table_privilege('authenticated', 'public.reports', 'insert'), 'reports are only made through report_content');
select ok(not has_table_privilege('authenticated', 'public.reports', 'update'), 'reporters cannot change reports');
select ok(not has_table_privilege('anon', 'public.reports', 'select'), 'signed-out visitors cannot read reports');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d3", "role": "authenticated", "is_anonymous": true}';
select throws_ok(
  $$select public.report_content('note', (select unkind from ids), 'hurtful')$$,
  '42501', 'Sign in to report', 'anonymous visitors cannot report'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d5';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d5", "role": "authenticated", "is_anonymous": false}';
select throws_ok(
  $$select public.report_content('note', (select unkind from ids), 'hurtful')$$,
  'P0002', 'Note not found', 'authors cannot report their own notes'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d2", "role": "authenticated", "is_anonymous": false}';
select throws_ok(
  $$select public.report_content('note', (select unkind from ids), 'boring')$$,
  '22023', 'Unknown reason', 'only known reasons'
);
select throws_ok(
  $$select public.report_content('memorial', (select unkind from ids), 'hurtful')$$,
  '22023', 'Only notes can be reported for now', 'only notes for now'
);
select throws_ok(
  $$select public.report_content('note', (select unkind from ids), 'other', repeat('a', 501))$$,
  '22023', 'Details can be up to 500 characters', 'details have a length limit'
);
select throws_ok(
  $$select public.report_content('note', gen_random_uuid(), 'spam')$$,
  'P0002', 'Note not found', 'unknown notes cannot be reported'
);
select lives_ok(
  $$select public.report_content('note', (select unkind from ids), 'hurtful', '  It names a living person.  ')$$,
  'a member reports a note'
);
select throws_ok(
  $$select public.report_content('note', (select unkind from ids), 'spam')$$,
  'P0001', 'Already reported', 'one report per person per note'
);
select results_eq(
  $$select reason, details, status from public.reports$$,
  $$values ('hurtful'::text, 'It names a living person.'::text, 'open'::text)$$,
  'the reporter sees their own report, trimmed and open'
);
reset role;

insert into public.reports (reporter_id, target_type, target_id, reason, created_at)
  select '00000000-0000-0000-0000-0000000000d2', 'note', gen_random_uuid(), 'spam', now() from generate_series(1, 19);
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d2", "role": "authenticated", "is_anonymous": false}';
select throws_ok(
  $$select public.report_content('note', (select another from ids), 'spam')$$,
  'P0001', 'Report limit reached', 'at most 20 reports a day'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d1", "role": "authenticated", "is_anonymous": false}';
select is((select count(*)::int from public.reports), 0, 'the memorial owner does not see who reported');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d4';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000d4", "role": "authenticated", "is_anonymous": false}';
select is((select count(*)::int from public.reports), 20, 'admins see every report');
reset role;

select * from finish();
rollback;
