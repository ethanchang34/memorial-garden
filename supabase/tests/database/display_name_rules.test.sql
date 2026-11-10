begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(39);

select is(private.display_name_problem('Alex C.'), null, 'first name and initial');
select is(private.display_name_problem('Zoë S.'), null, 'accented letters');
select is(private.display_name_problem('Mary-Kate O’Brien'), null, 'hyphen and curly apostrophe');
select is(private.display_name_problem('Jean-Luc d''Arcy'), null, 'straight apostrophe');
select is(private.display_name_problem('李明'), null, 'Chinese');
select is(private.display_name_problem('प्रिया श.'), null, 'Devanagari with combining marks');
select is(private.display_name_problem('محمد ع.'), null, 'Arabic');
select is(private.display_name_problem('J.R.R. T.'), null, 'initials with periods');
select is(private.display_name_problem('Sam 2'), null, 'numbers next to letters');
select is(private.display_name_problem('Admiral Ann'), null, 'reserved words only match whole words');

select is(private.display_name_problem(''), 'empty', 'empty');
select is(private.display_name_problem(repeat('a', 41)), 'too_long', 'over 40 characters');
select is(private.display_name_problem(' Alex'), 'spacing', 'leading space');
select is(private.display_name_problem('Alex  C.'), 'spacing', 'double space');
select is(private.display_name_problem('E' || chr(768) || 've'), 'normalization', 'decomposed accent');
select is(private.display_name_problem('$$$'), 'characters', 'dollar signs');
select is(private.display_name_problem('Alex?'), 'characters', 'question mark');
select is(private.display_name_problem('a/b'), 'characters', 'slash');
select is(private.display_name_problem('me@example'), 'characters', 'at sign');
select is(private.display_name_problem('<b>Alex</b>'), 'characters', 'angle brackets');
select is(private.display_name_problem('Alex 🌸'), 'characters', 'emoji');
select is(private.display_name_problem('Al' || chr(8203) || 'ex'), 'characters', 'zero-width space');
select is(private.display_name_problem('Alex' || chr(8238) || 'gpj'), 'characters', 'right-to-left override');
select is(private.display_name_problem('Alex' || chr(10) || 'C.'), 'characters', 'line break');
select is(private.display_name_problem('Alex™'), 'characters', 'trademark sign');
select is(private.display_name_problem('12345'), 'no_letter', 'digits only');
select is(private.display_name_problem('...'), 'no_letter', 'punctuation only');
select is(private.display_name_problem('Admin'), 'reserved', 'admin');
select is(private.display_name_problem('The Moderator'), 'reserved', 'moderator');
select is(private.display_name_problem('Memorial Garden Help'), 'reserved', 'site name');
select is(private.display_name_problem('www.spam'), 'link', 'www');
select is(private.display_name_problem('Buy cheap.com'), 'link', 'domain');

select is(private.default_display_name('Alex 🌸 Chang'), 'Alex C.', 'default name drops emoji');
select is(private.default_display_name('Admin User'), 'Member', 'default name avoids reserved words');
select is(private.default_display_name('$$$'), 'Member', 'default name with no letters falls back');
select is(private.default_display_name('Zoë Saldaña'), 'Zoë S.', 'default name keeps accents');

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000b1', '{"full_name": "Pat 🌻 Lee"}');
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'),
  'Pat L.',
  'sign-up with an emoji in the Google name still works'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select throws_ok(
  $q$update public.profiles set display_name = 'Free $$$'$q$,
  '23514',
  null,
  'users cannot bypass the rules by calling the database directly'
);
select lives_ok(
  $$update public.profiles set display_name = 'Pat Lee-O’Hara'$$,
  'valid names still save'
);
reset role;

select * from finish();
rollback;
