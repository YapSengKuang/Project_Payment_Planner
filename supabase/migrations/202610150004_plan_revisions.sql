-- Named revisions capture the database's original inputs, plus a validated proposal.
create table public.plan_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  schema_version integer not null default 1 check (schema_version = 1),
  baseline jsonb not null check (jsonb_typeof(baseline) = 'object'),
  settings jsonb not null check (jsonb_typeof(settings) = 'object'),
  source_revision_id uuid references public.plan_revisions(id),
  created_at timestamptz not null default now()
);
create index plan_revisions_project_created_idx on public.plan_revisions(project_id, created_at desc, id);
alter table public.plan_revisions enable row level security;
revoke all on public.plan_revisions from anon, authenticated;
grant select on public.plan_revisions to authenticated;
create policy plan_revisions_owner_read on public.plan_revisions for select to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid())));

-- The only authenticated write path. All schedule writes take the same project lock.
create function public.save_plan_revision(
  p_project_id uuid, p_name text, p_expected_baseline jsonb, p_settings jsonb,
  p_source_revision_id uuid default null
) returns setof public.plan_revisions
language plpgsql security definer set search_path = '' as $$
declare
  v_project public.projects;
  v_baseline jsonb;
  v_row jsonb;
  v_change jsonb;
  v_delay integer;
  v_increase integer;
  v_cap bigint;
  v_amount bigint;
  v_date date;
  v_total bigint := 0;
  v_deposits bigint := 0;
begin
  select * into v_project from public.projects
    where id = p_project_id and owner_id = (select auth.uid()) for update;
  if not found then raise exception 'Project unavailable'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 160 then raise exception 'Enter a revision name of 1 to 160 characters'; end if;
  if p_source_revision_id is not null then
    select baseline into v_baseline from public.plan_revisions where id = p_source_revision_id and project_id = p_project_id;
    if not found then raise exception 'Source revision unavailable'; end if;
  else
    if (select count(*) from public.expenses where project_id = p_project_id) > 10000 or
       (select count(*) from public.milestones where project_id = p_project_id) > 10000 then
      raise exception 'Schedule exceeds the supported entry count';
    end if;
    v_baseline := jsonb_build_object('project', to_jsonb(v_project),
      'expenses', coalesce((select jsonb_agg(to_jsonb(e) order by e.id) from public.expenses e where project_id = p_project_id), '[]'::jsonb),
      'milestones', coalesce((select jsonb_agg(to_jsonb(m) order by m.id) from public.milestones m where project_id = p_project_id), '[]'::jsonb));
  end if;
  if p_expected_baseline is distinct from v_baseline then raise exception 'Saved inputs changed. Reopen the project before saving this revision'; end if;
  if p_settings is null or jsonb_typeof(p_settings) <> 'object' or
     p_settings - array['receiptDelayDays','expenseIncreasePercent','depositCapCents','changes'] <> '{}'::jsonb or
     jsonb_typeof(p_settings->'receiptDelayDays') is distinct from 'number' or
     jsonb_typeof(p_settings->'expenseIncreasePercent') is distinct from 'number' or
     jsonb_typeof(p_settings->'depositCapCents') is distinct from 'number' or
     jsonb_typeof(p_settings->'changes') is distinct from 'array' or
     (p_settings->>'receiptDelayDays') !~ '^[0-9]{1,3}$' or
     (p_settings->>'expenseIncreasePercent') !~ '^[0-9]{1,3}$' or
     (p_settings->>'depositCapCents') !~ '^[0-9]{1,11}$' then
    raise exception 'Invalid proposal settings';
  end if;
  v_delay := (p_settings->>'receiptDelayDays')::integer;
  v_increase := (p_settings->>'expenseIncreasePercent')::integer;
  v_cap := (p_settings->>'depositCapCents')::bigint;
  if v_delay > 365 or v_increase > 100 or v_cap > (v_baseline->'project'->>'price_cents')::bigint then raise exception 'Proposal settings exceed supported limits'; end if;
  if jsonb_array_length(p_settings->'changes') > jsonb_array_length(v_baseline->'milestones') then raise exception 'Too many payment changes'; end if;
  if (select count(*) <> count(distinct c->>'id') from jsonb_array_elements(p_settings->'changes') c) then raise exception 'Duplicate payment changes'; end if;
  for v_change in select * from jsonb_array_elements(p_settings->'changes') loop
    if jsonb_typeof(v_change) <> 'object' or
       v_change - array['id','amount_cents','receipt_date','reason'] <> '{}'::jsonb or
       jsonb_typeof(v_change->'amount_cents') is distinct from 'number' or
       coalesce(v_change->>'amount_cents','') !~ '^[0-9]{1,11}$' or
       jsonb_typeof(v_change->'receipt_date') is distinct from 'string' or
       coalesce(v_change->>'receipt_date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or
       jsonb_typeof(v_change->'reason') is distinct from 'string' or
       coalesce(char_length(btrim(v_change->>'reason')),0) not between 1 and 500 then
      raise exception 'Each changed payment requires a positive whole-cent amount, valid date and explanation';
    end if;
    if not exists (select 1 from jsonb_array_elements(v_baseline->'milestones') m where m->>'id' = v_change->>'id') then raise exception 'Unknown payment'; end if;
    if (v_change->>'amount_cents')::bigint not between 1 and 99999999999 then raise exception 'Invalid payment amount'; end if;
    v_date := (v_change->>'receipt_date')::date;
    if v_date not between date '1900-01-01' and date '9999-12-31' then raise exception 'Invalid payment date'; end if;
  end loop;
  for v_row in select * from jsonb_array_elements(v_baseline->'milestones') loop
    select c into v_change from jsonb_array_elements(p_settings->'changes') c where c->>'id' = v_row->>'id';
    v_amount := coalesce(v_change->>'amount_cents', v_row->>'amount_cents')::bigint;
    v_date := coalesce(v_change->>'receipt_date', v_row->>'expected_receipt_date')::date + v_delay;
    if v_date > date '9999-12-31' then raise exception 'Delayed receipt exceeds supported date range'; end if;
    v_total := v_total + v_amount;
    if v_row->>'kind' = 'deposit' then v_deposits := v_deposits + v_amount; end if;
  end loop;
  if v_total <> (v_baseline->'project'->>'price_cents')::bigint or
     (select coalesce(sum((m->>'amount_cents')::bigint),0) from jsonb_array_elements(v_baseline->'milestones') m) <> v_total then
    raise exception 'Original and proposed client payments must both match the project price';
  end if;
  if v_deposits > v_cap then raise exception 'Proposed deposits exceed the configured maximum'; end if;
  for v_row in select * from jsonb_array_elements(v_baseline->'expenses') loop
    if (((v_row->>'amount_cents')::bigint * (100 + v_increase) + 50) / 100) > 99999999999 then raise exception 'Increased expense exceeds supported amount'; end if;
  end loop;
  return query insert into public.plan_revisions(project_id, name, baseline, settings, source_revision_id)
    values (p_project_id, btrim(p_name), v_baseline, p_settings, p_source_revision_id) returning *;
end;
$$;
revoke all on function public.save_plan_revision(uuid,text,jsonb,jsonb,uuid) from public, anon;
grant execute on function public.save_plan_revision(uuid,text,jsonb,jsonb,uuid) to authenticated;
