begin;

-- Stage 3G: public UCUA submission, email-OTP history, anonymous tracking.
-- Phone/SMS is intentionally not required. The legacy phone column remains nullable.
alter table public.observations add column if not exists tracking_token_hash text;
alter table public.observations add column if not exists photo_storage_path text;

create table if not exists public.reference_counters (
  kind text not null,
  year integer not null,
  last_value integer not null default 0,
  primary key (kind, year)
);

create or replace function public.next_portal_reference(p_kind text, p_prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y integer := extract(year from now())::integer;
  n integer;
begin
  insert into public.reference_counters(kind, year, last_value)
  values (p_kind, y, 1)
  on conflict (kind, year)
  do update set last_value = public.reference_counters.last_value + 1
  returning last_value into n;
  return p_prefix || '-' || y::text || '-' || lpad(n::text, 5, '0');
end;
$$;

alter table public.reference_counters enable row level security;
grant select,insert,update on public.reference_counters to service_role;
grant execute on function public.next_portal_reference(text,text) to service_role;
grant select,insert,update,delete on public.observations to service_role;

-- Private bucket: files are written only by the server/service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ucua-photos', 'ucua-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
