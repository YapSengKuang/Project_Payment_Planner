create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  description text not null check (char_length(btrim(description)) between 1 and 160),
  amount_cents bigint not null check (amount_cents between 1 and 99999999999),
  payment_date date not null check (payment_date between date '1900-01-01' and date '9999-12-31'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expenses_project_date_idx on public.expenses(project_id, payment_date, id);
alter table public.expenses enable row level security;
revoke all on public.expenses from anon;
grant select, insert, update, delete on public.expenses to authenticated;
create policy expenses_owner on public.expenses for all to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())))
with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));

create function public.protect_schedule_metadata() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.project_id is distinct from old.project_id then
    raise exception 'Schedule entries cannot be moved to another project';
  end if;
  new.id := old.id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
create trigger protect_expense_metadata before update on public.expenses
for each row execute function public.protect_schedule_metadata();

-- Serialise entry writes with project edits, including GST-convention changes.
create function public.lock_schedule_project() returns trigger
language plpgsql set search_path = '' as $$
begin
  perform 1 from public.projects where id = new.project_id for update;
  return new;
end;
$$;
create trigger lock_expense_project before insert or update on public.expenses
for each row execute function public.lock_schedule_project();

create function public.protect_project_tax_basis() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.tax_basis is distinct from old.tax_basis and
    exists (select 1 from public.expenses where project_id = old.id) then
    raise exception 'GST convention cannot change while schedule entries exist';
  end if;
  return new;
end;
$$;
create trigger protect_project_tax_basis before update on public.projects
for each row execute function public.protect_project_tax_basis();
