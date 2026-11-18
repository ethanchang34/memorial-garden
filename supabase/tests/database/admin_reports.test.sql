begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(22);

insert into auth.users (id, raw_user_meta_data, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000a1', '{"full_name": "Owen Owner"}', false),
  ('00000000-0000-0000-0000-0000000000a2', '{"full_name": "Rae Reporter"}', false),
  ('00000000-0000-0000-0000-0000000000a3', '{"full_name": "Sam Second"}', false),
  ('00000000-0000-0000-0000-0000000000a4', '{"full_name": "Ada Admin"}', false),
  ('00000000-0000-0000-0000-0000000000a5', '{"full_name": "Wren Writer"}', false),
  ('00000000-0000-0000-0000-0000000000a6', '{}', true);
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-0000000000a4';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "is_anonymous": false}';
insert into public.memorials (owner_id, full_name, died_date, died_precision)
  values ('00000000-0000-0000-0000-0000000000a1', 'Shared One', '2020-01-01', 'year');
reset role;
update public.memorials set status = 'published' where full_name = 'Shared One';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a5';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a5", "role": "authenticated", "is_anonymous": false}';
insert into public.notes (memorial_id, author_id, body)
  select id, '00000000-0000-0000-0000-0000000000a5', 'Something unkind' from public.memorials;
insert into public.notes (memorial_id, author_id, body)
  select id, '00000000-0000-0000-0000-0000000000a5', 'Probably fine' from public.memorials;
reset role;

create temporary table ids as
  select
    (select id from public.notes where body = 'Something unkind') as unkind,
    (select id from public.notes where body = 'Probably fine') as fine;
grant select on ids to anon, authenticated;

insert into public.reports (reporter_id, target_type, target_id, reason, details) values
  ('00000000-0000-0000-0000-0000000000a2', 'note', (select unkind from ids), 'hurtful', 'Names a living person'),
  ('00000000-0000-0000-0000-0000000000a3', 'note', (select unkind from ids), 'private', null),
  ('00000000-0000-0000-0000-0000000000a2', 'note', (select fine from ids), 'spam', null);

select ok(has_function_privilege('authenticated', 'public.admin_report_queue()', 'execute'), 'the queue function is callable when signed in');
select ok(not has_function_privilege('anon', 'public.admin_report_queue()', 'execute'), 'signed-out visitors cannot call the queue');
select ok(not has_function_privilege('anon', 'public.admin_resolve_note_reports(uuid, text, text)', 'execute'), 'signed-out visitors cannot resolve');
select ok(not has_function_privilege('authenticated', 'private.require_admin()', 'execute'), 'the admin check is private');
select ok(not has_table_privilege('authenticated', 'public.admin_actions', 'insert'), 'the audit log is written only by admin functions');
select ok(not has_table_privilege('anon', 'public.admin_actions', 'select'), 'signed-out visitors cannot read the audit log');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated", "is_anonymous": false}';
select throws_ok($$select * from public.admin_report_queue()$$, '42501', 'Admins only', 'a memorial owner who is not an admin cannot see the queue');
select throws_ok(
  $$select public.admin_resolve_note_reports((select unkind from ids), 'remove', 'because')$$,
  '42501', 'Admins only', 'non-admins cannot resolve reports'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a6';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a6", "role": "authenticated", "is_anonymous": true}';
select throws_ok($$select * from public.admin_report_queue()$$, '42501', 'Admins only', 'anonymous visitors cannot see the queue');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a4';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a4", "role": "authenticated", "is_anonymous": false}';
select results_eq(
  $$select note_body, author_name, memorial_slug, report_count, reasons, details from public.admin_report_queue()$$,
  $$values
    ('Something unkind'::text, 'Wren W.'::text, 'shared-one-2020'::text, 2, '{hurtful,private}'::text[], '{"Names a living person"}'::text[]),
    ('Probably fine'::text, 'Wren W.'::text, 'shared-one-2020'::text, 1, '{spam}'::text[], '{}'::text[])$$,
  'the admin sees open reports grouped by note, most reported first'
);
select throws_ok(
  $$select public.admin_resolve_note_reports((select fine from ids), 'dismiss', '   ')$$,
  '22023', 'Give a reason', 'every decision needs a reason'
);
select throws_ok(
  $$select public.admin_resolve_note_reports((select fine from ids), 'ban', 'because')$$,
  '22023', 'Unknown decision', 'only known decisions'
);
select is(
  public.admin_resolve_note_reports((select fine from ids), 'dismiss', 'It is a kind note'),
  1,
  'dismissing closes the report'
);
select is((select status from public.notes where id = (select fine from ids)), 'visible', 'a dismissed note stays up');
select is(
  public.admin_resolve_note_reports((select unkind from ids), 'remove_and_suspend', 'Harassment'),
  2,
  'removing closes every report on the note'
);
reset role;

select is((select status from public.notes where id = (select unkind from ids)), 'removed', 'the note is removed');
select is((select status from public.profiles where id = '00000000-0000-0000-0000-0000000000a5'), 'suspended', 'the writer is suspended');
select results_eq(
  $$select status, resolved_by from public.reports where target_id = (select unkind from ids) order by reason$$,
  $$values ('actioned'::text, '00000000-0000-0000-0000-0000000000a4'::uuid), ('actioned'::text, '00000000-0000-0000-0000-0000000000a4'::uuid)$$,
  'the reports record who resolved them'
);
select results_eq(
  $$select action, target_type, reason from public.admin_actions order by created_at, action$$,
  $$values
    ('dismiss_reports'::text, 'note'::text, 'It is a kind note'::text),
    ('remove_note'::text, 'note'::text, 'Harassment'::text),
    ('resolve_reports'::text, 'note'::text, 'Harassment'::text),
    ('suspend_user'::text, 'profile'::text, 'Harassment'::text)$$,
  'every action is in the audit log'
);
select throws_ok(
  $$delete from public.admin_actions$$,
  '42501', 'admin_actions is append-only', 'the audit log cannot be deleted'
);
select throws_ok(
  $$update public.admin_actions set reason = 'edited'$$,
  '42501', 'admin_actions is append-only', 'the audit log cannot be edited'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a4';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a4", "role": "authenticated", "is_anonymous": false}';
select is((select count(*)::int from public.admin_report_queue()), 0, 'the queue is empty once everything is resolved');
reset role;

select * from finish();
rollback;
