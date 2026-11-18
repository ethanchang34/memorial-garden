create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('memorial', 'note', 'voice_memo', 'photo')),
  target_id uuid not null,
  reason text not null check (reason in ('hurtful', 'spam', 'private', 'not_about', 'other')),
  details text check (
    char_length(details) between 1 and 500
    and details = btrim(details)
    and details !~ '[\u0001-\u0009\u000B-\u001F\u007F]'
  ),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index reports_once_per_target on public.reports (reporter_id, target_type, target_id);
create index reports_open_idx on public.reports (status, created_at) where status = 'open';

alter table public.reports enable row level security;

revoke all on public.reports from public, anon, authenticated;
grant select on public.reports to authenticated;

create policy "Reporters see their own reports"
  on public.reports for select
  to authenticated
  using ((select auth.uid()) = reporter_id);

create policy "Admins see every report"
  on public.reports for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));

create function public.report_content(target_type text, target_id uuid, reason text, details text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  reporter uuid := auth.uid();
  clean text := nullif(btrim(details), '');
  report_id uuid;
begin
  if reporter is null or coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean,
    false
  ) then
    raise exception 'Sign in to report' using errcode = '42501', hint = 'report_needs_account';
  end if;

  if not exists (select 1 from public.profiles p where p.id = reporter and p.status = 'active') then
    raise exception 'Reporter not allowed' using errcode = '42501';
  end if;

  if target_type is distinct from 'note' then
    raise exception 'Only notes can be reported for now' using errcode = '22023';
  end if;

  if reason is null or reason not in ('hurtful', 'spam', 'private', 'not_about', 'other') then
    raise exception 'Unknown reason' using errcode = '22023';
  end if;

  if clean is not null and (char_length(clean) > 500 or clean ~ '[\u0001-\u0009\u000B-\u001F\u007F]') then
    raise exception 'Details can be up to 500 characters' using errcode = '22023', hint = 'report_details_invalid';
  end if;

  if not exists (
    select 1
    from public.notes n
    join public.memorials m on m.id = n.memorial_id
    where n.id = report_content.target_id
      and n.status = 'visible'
      and m.status = 'published'
      and n.author_id is distinct from reporter
  ) then
    raise exception 'Note not found' using errcode = 'P0002';
  end if;

  if (
    select count(*) from public.reports r
    where r.reporter_id = reporter and r.created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'Report limit reached' using errcode = 'P0001', hint = 'report_rate_limit';
  end if;

  begin
    insert into public.reports (reporter_id, target_type, target_id, reason, details)
    values (reporter, 'note', report_content.target_id, reason, clean)
    returning id into report_id;
  exception when unique_violation then
    raise exception 'Already reported' using errcode = 'P0001', hint = 'already_reported';
  end;

  return report_id;
end;
$$;

revoke all on function public.report_content(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.report_content(text, uuid, text, text) to authenticated;
