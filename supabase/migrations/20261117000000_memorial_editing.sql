alter table public.memorials
  add column life_story text
    check (
      char_length(life_story) between 1 and 10000
      and life_story = btrim(life_story)
      and life_story !~ '[\u0001-\u0009\u000B-\u001F\u007F]'
    );

grant update (life_story) on public.memorials to authenticated;

create or replace function private.memorials_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
begin
  if new.died_date > current_date + 1 then
    raise exception 'The date of death is in the future' using errcode = '23514';
  end if;

  if old.status = 'draft' and new.status = 'draft'
    and (new.full_name is distinct from old.full_name or new.died_date is distinct from old.died_date) then
    base := left(private.memorial_slug_base(new.full_name, new.died_date), 72);
    if old.slug <> base and old.slug !~ ('^' || base || '-[0-9a-f]{4}$') then
      candidate := base;
      while exists (select 1 from public.memorials where slug = candidate and id <> old.id) loop
        candidate := base || '-' || substr(md5(gen_random_uuid()::text), 1, 4);
      end loop;
      new.slug := candidate;
    end if;
  else
    new.slug := old.slug;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.memorials_before_update() from public, anon, authenticated;
