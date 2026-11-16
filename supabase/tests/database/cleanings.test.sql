begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(18);

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', '{"full_name": "Owen Owner"}'),
  ('00000000-0000-0000-0000-0000000000c2', '{}'),
  ('00000000-0000-0000-0000-0000000000c3', '{"full_name": "Bo Banned"}');
update public.profiles set time_zone = 'Pacific/Kiritimati' where id = '00000000-0000-0000-0000-0000000000c2';
update public.profiles set status = 'banned' where id = '00000000-0000-0000-0000-0000000000c3';

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c1", "role": "authenticated", "is_anonymous": false}';
insert into public.memorials (owner_id, full_name, died_date, died_precision)
  values ('00000000-0000-0000-0000-0000000000c1', 'Shared One', '2020-01-01', 'year'),
         ('00000000-0000-0000-0000-0000000000c1', 'Draft One', '2021-01-01', 'year');
select throws_ok(
  $$update public.memorials set last_cleaned_at = now() where full_name = 'Draft One'$$,
  '42501', null, 'owners cannot set last_cleaned_at directly'
);
reset role;
update public.memorials set status = 'published', published_at = now() - interval '30 days' where full_name = 'Shared One';

create temporary table ids as
  select
    (select id from public.memorials where full_name = 'Shared One') as shared,
    (select id from public.memorials where full_name = 'Draft One') as draft;
grant select on ids to anon, authenticated;

select ok(has_function_privilege('anon', 'public.stone_state(uuid)', 'execute'), 'visitors can read the stone state');
select ok(has_function_privilege('authenticated', 'public.clean_stone(uuid)', 'execute'), 'signed-in users can clean');
select ok(not has_function_privilege('anon', 'public.clean_stone(uuid)', 'execute'), 'signed-out visitors cannot clean');
select ok(not has_function_privilege('authenticated', 'private.stone_state(uuid, uuid)', 'execute'), 'the internal state function is private');
select ok(has_table_privilege('authenticated', 'public.cleanings', 'select'), 'visitors can read their own cleanings');
select ok(not has_table_privilege('authenticated', 'public.cleanings', 'insert'), 'cleanings are only made through clean_stone');

set local request.jwt.claim.sub = '';
set local request.jwt.claims = '';
set local role anon;
select results_eq(
  $$select dirty_since::date, cleaned_today from public.stone_state((select shared from ids))$$,
  $$values ((now() - interval '30 days')::date, false)$$,
  'an uncleaned stone has been gathering moss since it was shared'
);
select is(
  (select count(*)::int from public.stone_state((select draft from ids))),
  0,
  'drafts reveal nothing to visitors'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c2", "role": "authenticated", "is_anonymous": true}';
select results_eq(
  $$select dirty_since = now(), cleaned_today from public.clean_stone((select shared from ids))$$,
  $$values (true, true)$$,
  'an anonymous visitor cleans the stone'
);
select throws_ok(
  $$select * from public.clean_stone((select shared from ids))$$,
  'P0001', 'Already cleaned this stone today', 'one cleaning per visitor per memorial per day'
);
select throws_ok(
  $$select * from public.clean_stone((select draft from ids))$$,
  'P0002', 'Memorial not found', 'drafts cannot be cleaned'
);
select throws_ok(
  $$insert into public.cleanings (memorial_id, cleaned_by, cleaned_on) values ((select shared from ids), '00000000-0000-0000-0000-0000000000c2', current_date + 1)$$,
  '42501', null, 'visitors cannot insert cleanings directly'
);
reset role;

select is(
  (select cleaned_on from public.cleanings where cleaned_by = '00000000-0000-0000-0000-0000000000c2'),
  (now() at time zone 'Pacific/Kiritimati')::date,
  'the day is the visitor''s local day'
);
select is(
  (select last_cleaned_at = now() from public.memorials where full_name = 'Shared One'),
  true,
  'cleaning resets the stone for everyone'
);

update public.cleanings set cleaned_on = cleaned_on - 1;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c2", "role": "authenticated", "is_anonymous": true}';
select lives_ok(
  $$select * from public.clean_stone((select shared from ids))$$,
  'the same visitor can clean again the next day'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000c3", "role": "authenticated", "is_anonymous": false}';
select throws_ok(
  $$select * from public.clean_stone((select shared from ids))$$,
  '42501', 'Visitor not allowed', 'banned members cannot clean'
);
select is(
  (select count(*)::int from public.cleanings),
  0,
  'visitors see only their own cleanings'
);
reset role;

select * from finish();
rollback;
