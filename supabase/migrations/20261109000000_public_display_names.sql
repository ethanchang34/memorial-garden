create function public.public_display_names(user_ids uuid[])
returns table (id uuid, display_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if cardinality(user_ids) > 100 then
    raise exception 'At most 100 user ids per call' using errcode = '22023';
  end if;

  return query
    select p.id, p.display_name
    from public.profiles p
    where p.id = any (user_ids)
      and p.status <> 'banned';
end;
$$;

revoke all on function public.public_display_names(uuid[]) from public, anon, authenticated;
grant execute on function public.public_display_names(uuid[]) to anon, authenticated;
