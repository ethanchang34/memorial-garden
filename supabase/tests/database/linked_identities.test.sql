begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(6);

insert into auth.users (id, raw_user_meta_data, is_anonymous) values
  ('00000000-0000-0000-0000-0000000000f1', '{}', true),
  ('00000000-0000-0000-0000-0000000000f2', '{"full_name": "Grace Hopper"}', false),
  ('00000000-0000-0000-0000-0000000000f3', '{}', true);

select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000f1'),
  'Member',
  'an anonymous visitor starts as Member'
);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at)
values (
  'google-f1',
  '00000000-0000-0000-0000-0000000000f1',
  '{"full_name": "Ana López", "picture": "https://lh3.googleusercontent.com/a/ana"}',
  'google',
  now()
);

select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000f1'),
  'Ana L.',
  'linking Google gives the visitor their Google name'
);
select is(
  (select avatar_url from public.profiles where id = '00000000-0000-0000-0000-0000000000f1'),
  'https://lh3.googleusercontent.com/a/ana',
  'linking Google brings the photo along'
);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at)
values (
  'google-f2',
  '00000000-0000-0000-0000-0000000000f2',
  '{"full_name": "Someone Else"}',
  'google',
  now()
);

select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000f2'),
  'Grace H.',
  'a regular Google sign-up keeps the name it was created with'
);

update public.profiles set display_name = 'Chosen Name'
where id = '00000000-0000-0000-0000-0000000000f3';
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at)
values (
  'google-f3',
  '00000000-0000-0000-0000-0000000000f3',
  '{"full_name": "Google Name"}',
  'google',
  now()
);

select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000f3'),
  'Chosen Name',
  'a name the visitor already chose is kept'
);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at)
values (
  'google-f1-second',
  '00000000-0000-0000-0000-0000000000f1',
  '{"full_name": "Changed Later"}',
  'google',
  now()
);

select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000f1'),
  'Ana L.',
  'a second identity does not rename anyone'
);

select * from finish();
rollback;
