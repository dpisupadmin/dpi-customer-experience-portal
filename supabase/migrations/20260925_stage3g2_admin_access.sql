-- Stage 3G.2 - Administrator Access Management
-- Safe additive migration for the existing admins table.

alter table public.admins add column if not exists created_at timestamptz not null default now();

grant select, insert, update on public.admins to service_role;

-- Admin access remains server-side only. No anon/authenticated table grants are added.
