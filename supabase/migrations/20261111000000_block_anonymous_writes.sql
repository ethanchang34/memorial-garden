begin;
drop policy "Signed-in users create their own drafts" on public.memorials;
create policy "Signed-in users create their own drafts"
  on public.memorials for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and not coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false)
  );

drop policy "Owners edit their own memorials" on public.memorials;
create policy "Owners edit their own memorials"
  on public.memorials for update
  to authenticated
  using (
    (select auth.uid()) = owner_id
    and status in ('draft', 'published')
    and not coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false)
  )
  with check ((select auth.uid()) = owner_id);

drop policy "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (
    (select auth.uid()) = id
    and not coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean, false)
  )
  with check ((select auth.uid()) = id);
commit;
