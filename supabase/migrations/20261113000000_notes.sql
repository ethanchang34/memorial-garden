create table public.notes (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null
    check (char_length(body) between 1 and 2000 and body = btrim(body) and body !~ '[\u0001-\u0009\u000B-\u001F\u007F]'),
  status text not null default 'visible' check (status in ('visible', 'hidden_by_owner', 'removed')),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index notes_memorial_idx on public.notes (memorial_id, created_at desc);
create index notes_author_idx on public.notes (author_id, created_at desc);

create function private.is_anonymous()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false);
$$;

create function private.notes_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author public.profiles%rowtype;
begin
  if new.author_id is distinct from auth.uid() or private.is_anonymous() then
    raise exception 'Notes are written by signed-in members' using errcode = '42501';
  end if;

  select * into author from public.profiles where id = new.author_id;
  if not found or author.status <> 'active' then
    raise exception 'Member not allowed' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.memorials m
    where m.id = new.memorial_id
      and (m.status = 'published' or (m.status = 'draft' and m.owner_id = new.author_id))
  ) then
    raise exception 'Memorial not found' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('notes:' || new.author_id::text, 0));

  if author.created_at > now() - interval '24 hours'
    and (select count(*) from public.notes where author_id = new.author_id) >= 5 then
    raise exception 'New accounts can write 5 notes in their first day' using errcode = 'P0001', hint = 'note_new_account_limit';
  end if;

  if (select count(*) from public.notes where author_id = new.author_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'At most 10 notes an hour' using errcode = 'P0001', hint = 'note_rate_limit';
  end if;

  new.status := 'visible';
  new.created_at := now();
  new.edited_at := null;
  return new;
end;
$$;

create trigger notes_before_insert
  before insert on public.notes
  for each row execute function private.notes_before_insert();

create function private.notes_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create trigger notes_before_update
  before update on public.notes
  for each row execute function private.notes_before_update();

alter table public.notes enable row level security;

revoke all on public.notes from public, anon, authenticated;
grant select on public.notes to anon, authenticated;
grant insert (memorial_id, author_id, body) on public.notes to authenticated;
grant update (body) on public.notes to authenticated;
grant delete on public.notes to authenticated;

create policy "Anyone can read visible notes on shared memorials"
  on public.notes for select
  to anon, authenticated
  using (
    status = 'visible'
    and exists (select 1 from public.memorials m where m.id = memorial_id and m.status = 'published')
  );

create policy "Authors can read their own notes"
  on public.notes for select
  to authenticated
  using ((select auth.uid()) = author_id and status <> 'removed');

create policy "Owners can read notes on their memorials"
  on public.notes for select
  to authenticated
  using (
    status <> 'removed'
    and exists (select 1 from public.memorials m where m.id = memorial_id and m.owner_id = (select auth.uid()))
  );

create policy "Members write their own notes"
  on public.notes for insert
  to authenticated
  with check ((select auth.uid()) = author_id and not coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false));

create policy "Authors edit their own notes"
  on public.notes for update
  to authenticated
  using ((select auth.uid()) = author_id and status <> 'removed' and not coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false))
  with check ((select auth.uid()) = author_id);

create policy "Authors delete their own notes"
  on public.notes for delete
  to authenticated
  using ((select auth.uid()) = author_id and not coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false));

create function public.set_note_hidden(note_id uuid, hidden boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  result text;
begin
  if auth.uid() is null or private.is_anonymous() then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  update public.notes n
  set status = case when hidden then 'hidden_by_owner' else 'visible' end
  where n.id = note_id
    and n.status <> 'removed'
    and exists (select 1 from public.memorials m where m.id = n.memorial_id and m.owner_id = auth.uid())
  returning n.status into result;

  if result is null then
    raise exception 'Note not found' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

revoke all on function private.is_anonymous() from public, anon, authenticated;
revoke all on function private.notes_before_insert() from public, anon, authenticated;
revoke all on function private.notes_before_update() from public, anon, authenticated;
revoke all on function public.set_note_hidden(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_note_hidden(uuid, boolean) to authenticated;
