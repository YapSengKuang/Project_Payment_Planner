create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  client_name text not null check (char_length(btrim(client_name)) between 1 and 160),
  price_cents bigint not null check (price_cents between 1 and 99999999999),
  starting_cash_cents bigint not null default 0 check (starting_cash_cents between 0 and 99999999999),
  currency text not null default 'AUD' check (currency = 'AUD'),
  start_date date not null check (start_date between date '1900-01-01' and date '9999-12-31'),
  end_date date not null check (end_date between start_date and date '9999-12-31'),
  tax_basis text not null default 'inclusive' check (tax_basis in ('inclusive', 'exclusive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_owner_updated_idx on public.projects (owner_id, updated_at desc);

create function public.protect_project_metadata() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Project ownership cannot be changed';
  end if;
  new.id := old.id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
create trigger protect_project_metadata before update on public.projects
for each row execute function public.protect_project_metadata();

alter table public.projects enable row level security;
revoke all on public.projects from anon;
grant select, insert, update, delete on public.projects to authenticated;
create policy projects_select_owner on public.projects for select to authenticated using ((select auth.uid()) = owner_id);
create policy projects_insert_owner on public.projects for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy projects_update_owner on public.projects for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy projects_delete_owner on public.projects for delete to authenticated using ((select auth.uid()) = owner_id);
