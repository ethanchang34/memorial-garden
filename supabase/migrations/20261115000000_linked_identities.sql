create function private.handle_linked_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from auth.identities i where i.user_id = new.user_id and i.id <> new.id
  ) then
    return new;
  end if;

  update public.profiles p
  set
    display_name = case
      when p.display_name = 'Member' then private.default_display_name(
        coalesce(new.identity_data ->> 'full_name', new.identity_data ->> 'name')
      )
      else p.display_name
    end,
    avatar_url = coalesce(
      p.avatar_url,
      nullif(coalesce(new.identity_data ->> 'avatar_url', new.identity_data ->> 'picture'), '')
    )
  where p.id = new.user_id;

  return new;
end;
$$;

create trigger on_auth_identity_linked
  after insert on auth.identities
  for each row execute function private.handle_linked_identity();

revoke all on function private.handle_linked_identity() from public, anon, authenticated;
