begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(13);

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000b1', '{"full_name": "Owen Owner"}'),
  ('00000000-0000-0000-0000-0000000000b2', '{"full_name": "Vera Visitor"}'),
  ('00000000-0000-0000-0000-0000000000b3', '{"full_name": "Other Owner"}');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b3';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b3", "role": "authenticated", "is_anonymous": false}';
insert into public.memorials (owner_id, full_name, died_date, died_precision)
  values ('00000000-0000-0000-0000-0000000000b3', 'Rosa Martinez', '2024-01-01', 'year');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b1", "role": "authenticated", "is_anonymous": false}';
insert into public.memorials (owner_id, full_name, died_date, died_precision)
  values ('00000000-0000-0000-0000-0000000000b1', 'Rosa Martnez', '2024-07-19', 'day'),
         ('00000000-0000-0000-0000-0000000000b1', 'Shared Person', '2020-01-01', 'year');
reset role;
update public.memorials set status = 'published', published_at = now() where full_name = 'Shared Person';

create temporary table ids as
  select
    (select id from public.memorials where full_name = 'Rosa Martnez') as draft,
    (select id from public.memorials where full_name = 'Shared Person') as shared;
grant select on ids to anon, authenticated;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b1", "role": "authenticated", "is_anonymous": false}';

select is(
  (select slug from public.memorials where id = (select draft from ids)),
  'rosa-martnez-2024',
  'the draft starts with a slug from its typo'
);
update public.memorials set full_name = 'Rosa Martínez' where id = (select draft from ids);
select matches(
  (select slug from public.memorials where id = (select draft from ids)),
  '^rosa-martinez-2024-[0-9a-f]{4}$',
  'fixing a draft''s name fixes its address without taking someone else''s'
);
update public.memorials set epitaph = 'Always in our garden' where id = (select draft from ids);
select matches(
  (select slug from public.memorials where id = (select draft from ids)),
  '^rosa-martinez-2024(-[0-9a-f]{4})?$',
  'editing other details keeps the address'
);

update public.memorials set full_name = 'Shared Person Renamed' where id = (select shared from ids);
select results_eq(
  $$select full_name, slug from public.memorials where id = (select shared from ids)$$,
  $$values ('Shared Person Renamed', 'shared-person-2020')$$,
  'a shared memorial keeps its address when renamed'
);

select lives_ok(
  $$update public.memorials set life_story = E'She grew roses.\n\nShe sang to them.' where id = (select shared from ids)$$,
  'the owner writes the life story'
);
select throws_ok(
  $$update public.memorials set life_story = repeat('a', 10001) where id = (select shared from ids)$$,
  '23514', null, 'the life story has a length limit'
);
select throws_ok(
  $$update public.memorials set life_story = E'bad\u0007bell' where id = (select shared from ids)$$,
  '23514', null, 'the life story rejects control characters'
);
select throws_ok(
  $$update public.memorials set life_story = '  padded  ' where id = (select shared from ids)$$,
  '23514', null, 'the life story is stored trimmed'
);
select throws_ok(
  $$update public.memorials set slug = 'something-else' where id = (select shared from ids)$$,
  '42501', null, 'owners cannot set the address directly'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000b2", "role": "authenticated", "is_anonymous": false}';
update public.memorials set life_story = 'Not mine to write' where id = (select shared from ids);
select is(
  (select life_story from public.memorials where id = (select shared from ids)),
  E'She grew roses.\n\nShe sang to them.',
  'other members cannot edit the life story'
);
select is(
  (select life_story from public.memorials where id = (select shared from ids)),
  E'She grew roses.\n\nShe sang to them.',
  'visitors can read the life story of a shared memorial'
);
reset role;

set local request.jwt.claim.sub = '';
set local request.jwt.claims = '';
set local role anon;
select is(
  (select life_story from public.memorials where id = (select shared from ids)),
  E'She grew roses.\n\nShe sang to them.',
  'signed-out visitors can read it too'
);
reset role;

select is(
  (select slug from public.memorials where full_name = 'Rosa Martinez'),
  'rosa-martinez-2024',
  'someone else''s memorial keeps its address'
);

select * from finish();
rollback;
