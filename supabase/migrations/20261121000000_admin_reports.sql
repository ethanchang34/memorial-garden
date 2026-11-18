create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index admin_actions_target_idx on public.admin_actions (target_type, target_id, created_at desc);

alter table public.admin_actions enable row level security;

revoke all on public.admin_actions from public, anon, authenticated;
grant select on public.admin_actions to authenticated;

create policy "Admins read the audit log"
  on public.admin_actions for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));

create function private.admin_actions_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'admin_actions is append-only' using errcode = '42501';
end;
$$;

create trigger admin_actions_append_only
  before update or delete on public.admin_actions
  for each row execute function private.admin_actions_append_only();

create function private.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null or not exists (
    select 1 from public.profiles p where p.id = caller and p.is_admin and p.status = 'active'
  ) then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return caller;
end;
$$;

create function public.admin_report_queue()
returns table (
  note_id uuid,
  note_body text,
  note_status text,
  note_created_at timestamptz,
  author_id uuid,
  author_name text,
  author_status text,
  memorial_slug text,
  memorial_name text,
  report_count integer,
  reasons text[],
  details text[],
  first_reported_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();

  return query
    select
      n.id,
      n.body,
      n.status,
      n.created_at,
      n.author_id,
      p.display_name,
      p.status,
      m.slug,
      m.full_name,
      count(*)::integer,
      array_agg(distinct r.reason order by r.reason),
      coalesce(array_agg(r.details order by r.created_at) filter (where r.details is not null), '{}'),
      min(r.created_at)
    from public.reports r
    join public.notes n on n.id = r.target_id
    join public.memorials m on m.id = n.memorial_id
    left join public.profiles p on p.id = n.author_id
    where r.target_type = 'note' and r.status = 'open'
    group by n.id, p.id, m.id
    order by count(*) desc, min(r.created_at);
end;
$$;

create function public.admin_resolve_note_reports(target_note uuid, decision text, reason text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin uuid := private.require_admin();
  clean text := btrim(reason);
  note public.notes%rowtype;
  author public.profiles%rowtype;
  resolved integer;
begin
  if decision is null or decision not in ('dismiss', 'remove', 'remove_and_suspend') then
    raise exception 'Unknown decision' using errcode = '22023';
  end if;

  if clean is null or char_length(clean) not between 1 and 500 then
    raise exception 'Give a reason' using errcode = '22023', hint = 'admin_reason_required';
  end if;

  select * into note from public.notes where id = target_note for update;
  if not found then
    raise exception 'Note not found' using errcode = 'P0002';
  end if;

  if decision in ('remove', 'remove_and_suspend') and note.status <> 'removed' then
    update public.notes set status = 'removed' where id = note.id;
    insert into public.admin_actions (admin_id, action, target_type, target_id, reason, before, after)
    values (admin, 'remove_note', 'note', note.id, clean,
            jsonb_build_object('status', note.status), jsonb_build_object('status', 'removed'));
  end if;

  if decision = 'remove_and_suspend' and note.author_id is not null then
    select * into author from public.profiles where id = note.author_id for update;
    if found and author.status = 'active' and not author.is_admin then
      update public.profiles set status = 'suspended' where id = author.id;
      insert into public.admin_actions (admin_id, action, target_type, target_id, reason, before, after)
      values (admin, 'suspend_user', 'profile', author.id, clean,
              jsonb_build_object('status', author.status), jsonb_build_object('status', 'suspended'));
    end if;
  end if;

  update public.reports r
  set status = case when decision = 'dismiss' then 'dismissed' else 'actioned' end,
      resolved_by = admin
  where r.target_type = 'note' and r.target_id = note.id and r.status = 'open';
  get diagnostics resolved = row_count;

  insert into public.admin_actions (admin_id, action, target_type, target_id, reason, after)
  values (admin, case when decision = 'dismiss' then 'dismiss_reports' else 'resolve_reports' end,
          'note', note.id, clean, jsonb_build_object('reports', resolved, 'decision', decision));

  return resolved;
end;
$$;

revoke all on function private.admin_actions_append_only() from public, anon, authenticated;
revoke all on function private.require_admin() from public, anon, authenticated;
revoke all on function public.admin_report_queue() from public, anon, authenticated;
revoke all on function public.admin_resolve_note_reports(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_report_queue() to authenticated;
grant execute on function public.admin_resolve_note_reports(uuid, text, text) to authenticated;
