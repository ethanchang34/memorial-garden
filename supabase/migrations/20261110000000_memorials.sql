create function private.memorial_slug_base(full_name text, died_date date)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(btrim(regexp_replace(regexp_replace(lower(normalize(full_name, nfkd)), '[\u0300-\u036f]', '', 'g'), '[^a-z0-9]+', '-', 'g'), '-'), ''),
    'memorial'
  ) || '-' || extract(year from died_date)::int;
$$;

create table public.memorials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  full_name text not null
    check (char_length(full_name) between 1 and 120 and full_name = btrim(full_name) and full_name !~ '[\u0001-\u001F\u007F]'),
  born_date date,
  born_precision text check (born_precision in ('day', 'month', 'year', 'circa')),
  died_date date not null,
  died_precision text not null check (died_precision in ('day', 'month', 'year', 'circa')),
  epitaph text check (char_length(epitaph) <= 160 and epitaph !~ '[\u0001-\u0009\u000B-\u001F\u007F]'),
  kind text not null default 'person' check (kind in ('person', 'pet')),
  visibility text not null default 'public' check (visibility in ('public')),
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint memorials_born_pair check ((born_date is null) = (born_precision is null)),
  constraint memorials_born_before_died check (born_date is null or born_date <= died_date),
  constraint memorials_born_range check (
    born_precision is null or born_precision = 'day'
    or (born_precision = 'month' and extract(day from born_date) = 1)
    or (born_precision in ('year', 'circa') and extract(day from born_date) = 1 and extract(month from born_date) = 1)
  ),
  constraint memorials_died_range check (
    died_precision = 'day'
    or (died_precision = 'month' and extract(day from died_date) = 1)
    or (died_precision in ('year', 'circa') and extract(day from died_date) = 1 and extract(month from died_date) = 1)
  )
);

create index memorials_owner_idx on public.memorials (owner_id, created_at desc);

create function private.memorials_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
begin
  if new.owner_id is distinct from auth.uid() then
    raise exception 'Memorials are created by their owner' using errcode = '42501';
  end if;

  if (select count(*) from public.memorials where owner_id = new.owner_id and status = 'draft') >= 2 then
    raise exception 'Draft limit reached' using errcode = 'P0001', hint = 'draft_limit';
  end if;

  if new.died_date > current_date + 1 then
    raise exception 'The date of death is in the future' using errcode = '23514';
  end if;

  base := left(private.memorial_slug_base(new.full_name, new.died_date), 72);
  candidate := base;
  while exists (select 1 from public.memorials where slug = candidate) loop
    candidate := base || '-' || substr(md5(gen_random_uuid()::text), 1, 4);
  end loop;

  new.slug := candidate;
  new.status := 'draft';
  new.published_at := null;
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

create trigger memorials_before_insert
  before insert on public.memorials
  for each row execute function private.memorials_before_insert();

create function private.memorials_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.died_date > current_date + 1 then
    raise exception 'The date of death is in the future' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger memorials_before_update
  before update on public.memorials
  for each row execute function private.memorials_before_update();

alter table public.memorials enable row level security;

revoke all on public.memorials from public, anon, authenticated;
grant select on public.memorials to anon, authenticated;
grant insert (owner_id, full_name, born_date, born_precision, died_date, died_precision, epitaph, kind)
  on public.memorials to authenticated;
grant update (full_name, born_date, born_precision, died_date, died_precision, epitaph)
  on public.memorials to authenticated;

create policy "Anyone can read published memorials"
  on public.memorials for select
  to anon, authenticated
  using (status = 'published');

create policy "Owners can read their own memorials"
  on public.memorials for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Signed-in users create their own drafts"
  on public.memorials for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owners edit their own memorials"
  on public.memorials for update
  to authenticated
  using ((select auth.uid()) = owner_id and status in ('draft', 'published'))
  with check ((select auth.uid()) = owner_id);

create function public.publish_memorial(memorial_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.memorials%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into target from public.memorials where id = memorial_id for update;
  if not found or target.owner_id is distinct from auth.uid() then
    raise exception 'Memorial not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'Sharing is not open yet' using errcode = '42501', hint = 'sharing_closed';
  end if;

  if target.status = 'draft' then
    update public.memorials set status = 'published', published_at = now() where id = memorial_id;
  end if;

  return target.slug;
end;
$$;

revoke all on function private.memorial_slug_base(text, date) from public, anon, authenticated;
revoke all on function private.memorials_before_insert() from public, anon, authenticated;
revoke all on function private.memorials_before_update() from public, anon, authenticated;
revoke all on function public.publish_memorial(uuid) from public, anon, authenticated;
grant execute on function public.publish_memorial(uuid) to authenticated;
