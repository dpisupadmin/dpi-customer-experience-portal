-- Stage 3G.3 - independent submission notification recipients
create table if not exists public.notification_recipients (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null check (notification_type in ('customer_survey','ucua')),
  name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid null references public.admins(id) on delete set null,
  unique(notification_type,email)
);
create index if not exists notification_recipients_type_active_idx on public.notification_recipients(notification_type,is_active);
revoke all on public.notification_recipients from anon, authenticated;
grant select, insert, update, delete on public.notification_recipients to service_role;
