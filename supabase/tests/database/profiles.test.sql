begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(25);

select is(private.default_display_name('Alex Chang'), 'Alex C.', 'first name and last initial');
select is(private.default_display_name('Mary Ann van Dyke'), 'Mary D.', 'uses the last name, uppercased');
select is(private.default_display_name('  Cher  '), 'Cher', 'single name stays as is');
select is(private.default_display_name('J'), 'J', 'single-letter name is allowed');
select is(private.default_display_name(''), 'Member', 'empty name falls back');
select is(private.default_display_name(null), 'Member', 'missing name falls back');
select is(
  private.default_display_name(repeat('a', 60) || ' Smith'),
  repeat('a', 37) || ' S.',
  'long first name with last initial fits in 40 characters'
);
select is(private.default_display_name(repeat('b', 60)), repeat('b', 40), 'long single name is cut to 40');

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', '{"full_name": "Alex Chang", "avatar_url": "https://example.com/a.png"}'),
  ('00000000-0000-0000-0000-000000000002', '{"name": "J"}'),
  ('00000000-0000-0000-0000-000000000003', '{}');

select results_eq(
  $$select id::text, display_name, avatar_url, time_zone, time_zone_changed_at from public.profiles order by id$$,
  $$values
    ('00000000-0000-0000-0000-000000000001', 'Alex C.', 'https://example.com/a.png', 'UTC', null::timestamptz),
    ('00000000-0000-0000-0000-000000000002', 'J', null, 'UTC', null),
    ('00000000-0000-0000-0000-000000000003', 'Member', null, 'UTC', null)$$,
  'sign-up creates a profile for every Google name shape'
);

set local role anon;
select throws_ok($$select 1 from public.profiles$$, '42501', null, 'anonymous visitors cannot read profiles');
select throws_ok($$select public.set_time_zone('America/Chicago')$$, '42501', null, 'anonymous visitors cannot set a time zone');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

select results_eq(
  $$select id::text from public.profiles$$,
  $$values ('00000000-0000-0000-0000-000000000001')$$,
  'users can read only their own profile'
);

select lives_ok(
  $$update public.profiles set display_name = 'Alex', locale = 'en-US'$$,
  'users can edit their display name and locale'
);
select throws_ok($$update public.profiles set display_name = ''$$, '23514', null, 'empty display name is rejected');
select throws_ok($$update public.profiles set display_name = repeat('x', 41)$$, '23514', null, 'display name over 40 is rejected');
select throws_ok($$update public.profiles set display_name = ' Alex'$$, '23514', null, 'untrimmed display name is rejected');
select throws_ok($$update public.profiles set is_admin = true$$, '42501', null, 'users cannot make themselves admin');
select throws_ok($$update public.profiles set status = 'active'$$, '42501', null, 'users cannot change their status');
select throws_ok($$update public.profiles set time_zone = 'Asia/Tokyo'$$, '42501', null, 'users cannot write time_zone directly');
select throws_ok($$update public.profiles set time_zone_changed_at = null$$, '42501', null, 'users cannot reset the time zone clock');
select throws_ok($$update public.profiles set avatar_url = 'https://evil.example'$$, '42501', null, 'users cannot set an arbitrary avatar URL');

select throws_ok($$select public.set_time_zone('Mars/Olympus')$$, '22023', null, 'unknown time zones are rejected');
select is(public.set_time_zone('America/Chicago'), 'America/Chicago', 'first time zone is accepted immediately');
select is(public.set_time_zone('Asia/Tokyo'), 'America/Chicago', 'a second change within 7 days is ignored');
reset role;

update public.profiles
set time_zone_changed_at = now() - interval '8 days'
where id = '00000000-0000-0000-0000-000000000001';

set local role authenticated;
select is(public.set_time_zone('Asia/Tokyo'), 'Asia/Tokyo', 'a change after 7 days is accepted');
reset role;

select * from finish();
rollback;
