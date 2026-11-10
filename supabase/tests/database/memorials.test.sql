begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(27);

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', '{"full_name": "Owen Owner"}'),
  ('00000000-0000-0000-0000-0000000000d2', '{"full_name": "Vera Visitor"}'),
  ('00000000-0000-0000-0000-0000000000d3', '{"full_name": "Ada Admin"}');
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-0000000000d3';

select is(private.memorial_slug_base('Rosa Martínez', '2024-07-19'), 'rosa-martinez-2024', 'slug strips accents and adds the year');
select is(private.memorial_slug_base('李明', '2020-01-01'), 'memorial-2020', 'non-Latin names fall back');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';

select lives_ok(
  $$insert into public.memorials (owner_id, full_name, born_date, born_precision, died_date, died_precision, epitaph)
    values ('00000000-0000-0000-0000-0000000000d1', 'Rosa Martínez', '1932-03-04', 'day', '2024-07-19', 'day', 'Always in our garden')$$,
  'an owner creates a draft'
);
select results_eq(
  $$select slug, status from public.memorials where owner_id = '00000000-0000-0000-0000-0000000000d1'$$,
  $$values ('rosa-martinez-2024', 'draft')$$,
  'the draft gets a slug and draft status'
);
select lives_ok(
  $$insert into public.memorials (owner_id, full_name, died_date, died_precision)
    values ('00000000-0000-0000-0000-0000000000d1', 'Rosa Martinez', '2024-01-01', 'year')$$,
  'a second memorial with the same name gets a unique slug'
);
select is(
  (select count(distinct slug)::int from public.memorials where full_name like 'Rosa Mart%'),
  2,
  'slugs never collide'
);
select throws_ok(
  $$insert into public.memorials (owner_id, full_name, died_date, died_precision)
    values ('00000000-0000-0000-0000-0000000000d1', 'Third Draft', '2024-01-01', 'year')$$,
  'P0001', 'Draft limit reached', 'at most 2 drafts per owner'
);
select throws_ok(
  $$insert into public.memorials (owner_id, full_name, died_date, died_precision, status)
    values ('00000000-0000-0000-0000-0000000000d1', 'Sneaky', '2024-01-01', 'year', 'published')$$,
  '42501', null, 'owners cannot set status on insert'
);
select throws_ok(
  $$insert into public.memorials (owner_id, full_name, died_date, died_precision)
    values ('00000000-0000-0000-0000-0000000000d2', 'Someone Else', '2024-01-01', 'year')$$,
  '42501', null, 'users cannot create memorials owned by others'
);
reset role;

select throws_ok(
  $$insert into public.memorials (owner_id, full_name, died_date, died_precision)
    values (null, 'x', '2024-03-04', 'month')$$,
  '42501', null, 'creation outside a signed-in owner is rejected'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d2';
select throws_ok(
  $$insert into public.memorials (owner_id, full_name, died_date, died_precision)
    values ('00000000-0000-0000-0000-0000000000d2', 'Bad Month', '2024-03-04', 'month')$$,
  '23514', null, 'month precision must be the first of the month'
);
select throws_ok(
  $$insert into public.memorials (owner_id, full_name, born_date, born_precision, died_date, died_precision)
    values ('00000000-0000-0000-0000-0000000000d2', 'Backwards', '2025-01-01', 'year', '2024-01-01', 'year')$$,
  '23514', null, 'birth must be before death'
);
select throws_ok(
  $$insert into public.memorials (owner_id, full_name, died_date, died_precision)
    values ('00000000-0000-0000-0000-0000000000d2', 'Future', current_date + 30, 'day')$$,
  '23514', null, 'death cannot be in the future'
);
select throws_ok(
  $$insert into public.memorials (owner_id, full_name, died_date, died_precision, epitaph)
    values ('00000000-0000-0000-0000-0000000000d2', 'Long', '2024-01-01', 'year', repeat('a', 161))$$,
  '23514', null, 'epitaph is at most 160 characters'
);
select is_empty(
  $$select 1 from public.memorials where owner_id = '00000000-0000-0000-0000-0000000000d1'$$,
  'other users cannot see drafts'
);
select lives_ok(
  $$update public.memorials set epitaph = 'hijacked' where slug = 'rosa-martinez-2024'$$,
  'an update of someone else''s memorial affects nothing'
);
select throws_ok(
  $$select public.publish_memorial((select id from public.memorials limit 1))$$,
  'P0002', null, 'other users cannot publish someone else''s memorial'
);
reset role;

set local role anon;
select is_empty($$select 1 from public.memorials$$, 'visitors cannot see drafts');
reset role;
select is(
  (select epitaph from public.memorials where slug = 'rosa-martinez-2024'),
  'Always in our garden',
  'the other user''s edit changed nothing'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d1';
select lives_ok(
  $$update public.memorials set epitaph = 'Forever in bloom' where slug = 'rosa-martinez-2024'$$,
  'owners edit their drafts'
);
select throws_ok(
  $$update public.memorials set status = 'published' where slug = 'rosa-martinez-2024'$$,
  '42501', null, 'owners cannot publish by editing status'
);
select throws_ok(
  $$update public.memorials set slug = 'new-slug' where slug = 'rosa-martinez-2024'$$,
  '42501', null, 'slugs never change'
);
select throws_ok(
  $$select public.publish_memorial((select id from public.memorials where slug = 'rosa-martinez-2024'))$$,
  '42501', 'Sharing is not open yet', 'publishing is closed for non-admins until checkout exists'
);
reset role;

update public.memorials set owner_id = '00000000-0000-0000-0000-0000000000d3' where slug = 'rosa-martinez-2024';
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d3';
select is(
  public.publish_memorial((select id from public.memorials where slug = 'rosa-martinez-2024')),
  'rosa-martinez-2024',
  'an admin owner can publish for the test group'
);
reset role;

set local role anon;
select results_eq(
  $$select slug, epitaph from public.memorials$$,
  $$values ('rosa-martinez-2024', 'Forever in bloom')$$,
  'visitors see published memorials only'
);
select ok(has_table_privilege('anon', 'public.memorials', 'select'), 'visitors have select');
reset role;
select ok(not has_table_privilege('anon', 'public.memorials', 'insert'), 'visitors cannot insert');

select * from finish();
rollback;
