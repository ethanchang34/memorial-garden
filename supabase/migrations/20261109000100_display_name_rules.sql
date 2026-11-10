create function private.display_name_problem(name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when name is null or char_length(name) = 0 then 'empty'
    when char_length(name) > 40 then 'too_long'
    when name <> btrim(name) or name ~ '\s\s' then 'spacing'
    when name <> normalize(name, nfc) then 'normalization'
    when name ~ '[\u0001-\u001F\u007F-\u009F!"#$%&()*+/:;<=>?@\[\\\]^_`{|}~\u00A0-\u00BF\u00D7\u00F7\u061C\u180E\u2000-\u2018\u201A-\u2BFF\u3000-\u303F\uE000-\uF8FF\uFE00-\uFE0F\uFE30-\uFE4F\uFEFF\uFFF0-\uFFFF\U0001F000-\U0001FAFF\U000E0000-\U000E007F]' then 'characters'
    when name !~ '[^0-9 .,''’-]' then 'no_letter'
    when name ~* '\m(admin|administrator|moderator|mod|staff|support|official)\M'
      or name ~* 'memorial\s*garden' then 'reserved'
    when name ~* '(^|[ .])www\.' or name ~* '\.(com|net|org|info|io|co|app|xyz|biz|me|ru)( |$)' then 'link'
    else null
  end;
$$;

create or replace function private.default_display_name(full_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  with cleaned as (
    select btrim(regexp_replace(
      regexp_replace(
        normalize(coalesce(full_name, ''), nfc),
        '[\u0001-\u001F\u007F-\u009F!"#$%&()*+/:;<=>?@\[\\\]^_`{|}~\u00A0-\u00BF\u00D7\u00F7\u061C\u180E\u2000-\u2018\u201A-\u2BFF\u3000-\u303F\uE000-\uF8FF\uFE00-\uFE0F\uFE30-\uFE4F\uFEFF\uFFF0-\uFFFF\U0001F000-\U0001FAFF\U000E0000-\U000E007F]',
        ' ',
        'g'
      ),
      '\s+', ' ', 'g'
    )) as value
  ),
  candidate as (
    select case
      when value = '' then 'Member'
      when cardinality(names) = 1 then left(names[1], 40)
      else left(names[1], 37) || ' ' || upper(left(names[cardinality(names)], 1)) || '.'
    end as value
    from cleaned, regexp_split_to_array(cleaned.value, ' ') as names
  )
  select case when private.display_name_problem(value) is null then value else 'Member' end
  from candidate;
$$;

update public.profiles
set display_name = private.default_display_name(display_name)
where private.display_name_problem(display_name) is not null;

alter table public.profiles
  add constraint profiles_display_name_rules
  check (private.display_name_problem(display_name) is null);

revoke all on function private.display_name_problem(text) from public, anon, authenticated;
grant execute on function private.display_name_problem(text) to authenticated;
