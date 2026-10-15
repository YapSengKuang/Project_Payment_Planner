create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('deposit', 'milestone')),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  amount_cents bigint not null check (amount_cents between 1 and 99999999999),
  completion_date date not null check (completion_date between date '1900-01-01' and date '9999-12-31'),
  invoice_date date not null check (invoice_date between date '1900-01-01' and date '9999-12-31'),
  payment_terms_days integer not null default 0 check (payment_terms_days between 0 and 365),
  receipt_override_date date check (receipt_override_date between date '1900-01-01' and date '9999-12-31'),
  receipt_override_reason text,
  expected_receipt_date date generated always as (coalesce(receipt_override_date, invoice_date + payment_terms_days)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((receipt_override_date is null and receipt_override_reason is null) or
    (receipt_override_date is not null and receipt_override_reason is not null and char_length(btrim(receipt_override_reason)) between 1 and 500)),
  check (invoice_date + payment_terms_days <= date '9999-12-31')
);
create index milestones_project_receipt_idx on public.milestones(project_id, expected_receipt_date, id);
alter table public.milestones enable row level security;
revoke all on public.milestones from anon;
grant select, insert, update, delete on public.milestones to authenticated;
create policy milestones_owner on public.milestones for all to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())))
with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));
create trigger protect_milestone_metadata before update on public.milestones
for each row execute function public.protect_schedule_metadata();
create trigger lock_milestone_project before insert or update on public.milestones
for each row execute function public.lock_schedule_project();

create or replace function public.protect_project_tax_basis() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.tax_basis is distinct from old.tax_basis and
    (exists (select 1 from public.expenses where project_id = old.id) or
     exists (select 1 from public.milestones where project_id = old.id)) then
    raise exception 'GST convention cannot change while schedule entries exist';
  end if;
  return new;
end;
$$;
