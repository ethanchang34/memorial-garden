begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(7);

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', '{}'),
  ('00000000-0000-0000-0000-0000000000e2', '{"full_name": "Real Person"}');
insert into public.memorials (owner_id, full_name, died_date, died_precision)
  select '00000000-0000-0000-0000-0000000000e2', 'Shared One', '2020-01-01', 'year'
  where false;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e2", "role": "authenticated", "is_anonymous": false}';
select lives_ok(
  $$insert into public.memorials (owner_id, full_name, died_date, died_precision)
    values ('00000000-0000-0000-0000-0000000000e2', 'Real Draft', '2020-01-01', 'year')$$,
  'a real account can still create drafts'
);
select lives_ok(
  $$update public.profiles set display_name = 'Real P.'$$,
  'a real account can still edit its profile'
);
reset role;
update public.memorials set status = 'published' where full_name = 'Real Draft';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000e1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000e1", "role": "authenticated", "is_anonymous": true}';
select throws_ok(
  $$insert into public.memorials (owner_id, full_name, died_date, died_precision)
    values ('00000000-0000-0000-0000-0000000000e1', 'Spam', '2020-01-01', 'year')$$,
  '42501', null, 'anonymous visitors cannot create memorials'
);
select lives_ok(
  $$update public.profiles set display_name = 'Spammy'$$,
  'an anonymous profile update runs but matches nothing'
);
select results_eq(
  $$select slug from public.memorials$$,
  $$values ('real-draft-2020')$$,
  'anonymous visitors can still read shared memorials'
);
reset role;

select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000e1'),
  'Member',
  'the anonymous profile was not renamed'
);
select is(
  (select count(*)::int from public.memorials where owner_id = '00000000-0000-0000-0000-0000000000e1'),
  0,
  'no memorial was created by the anonymous visitor'
);

select * from finish();
rollback;
