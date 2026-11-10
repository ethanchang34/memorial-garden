begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(10);

select ok(
  has_function_privilege('anon', 'public.public_display_names(uuid[])', 'execute'),
  'anonymous visitors can look up display names'
);
select ok(
  has_function_privilege('authenticated', 'public.public_display_names(uuid[])', 'execute'),
  'signed-in users can look up display names'
);
select ok(
  not has_function_privilege('anon', 'private.default_display_name(text)', 'execute'),
  'internal functions stay private'
);

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', '{"full_name": "Alex Chang"}'),
  ('00000000-0000-0000-0000-0000000000a2', '{"full_name": "Sam Lee"}'),
  ('00000000-0000-0000-0000-0000000000a3', '{"full_name": "Pat Banned"}');
update public.profiles set status = 'suspended' where id = '00000000-0000-0000-0000-0000000000a2';
update public.profiles set status = 'banned' where id = '00000000-0000-0000-0000-0000000000a3';

set local role anon;

select results_eq(
  $$select id::text, display_name from public.public_display_names(array[
      '00000000-0000-0000-0000-0000000000a1',
      '00000000-0000-0000-0000-0000000000a2',
      '00000000-0000-0000-0000-0000000000a3',
      '00000000-0000-0000-0000-0000000000ff'
    ]::uuid[]) order by id$$,
  $$values
    ('00000000-0000-0000-0000-0000000000a1', 'Alex C.'),
    ('00000000-0000-0000-0000-0000000000a2', 'Sam L.')$$,
  'returns names for requested users, skipping banned and unknown ids'
);

select is(
  (select count(*)::int from public.public_display_names('{}'::uuid[])),
  0,
  'an empty list returns nothing'
);
select is(
  (select count(*)::int from public.public_display_names(null)),
  0,
  'a missing list returns nothing'
);

select throws_ok(
  $$select * from public.public_display_names(array(select gen_random_uuid() from generate_series(1, 101)))$$,
  '22023',
  null,
  'more than 100 ids is rejected'
);

select columns_are(
  'public',
  'profiles',
  array['id', 'display_name', 'avatar_url', 'time_zone', 'time_zone_changed_at', 'locale', 'is_admin', 'status', 'created_at'],
  'profiles columns are unchanged'
);

select throws_ok(
  $$select display_name from public.profiles$$,
  '42501',
  null,
  'anonymous visitors still cannot read the profiles table'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select results_eq(
  $$select id::text from public.profiles$$,
  $$values ('00000000-0000-0000-0000-0000000000a1')$$,
  'signed-in users still read only their own profile row'
);
reset role;

select * from finish();
rollback;
