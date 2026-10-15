-- Private sample projects are created once per owner, atomically with their revisions.
create table public.demo_project_seeds (
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('showcase', 'draft')),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  primary key (owner_id, kind)
);
alter table public.demo_project_seeds enable row level security;
revoke all on public.demo_project_seeds from public, anon, authenticated;

create function public.load_demo_projects(p_start_date date default current_date)
returns setof public.projects
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_project_id uuid;
  v_deposit_id uuid;
  v_final_id uuid;
  v_original_id uuid;
  v_covered_id uuid;
  v_project public.projects;
  v_baseline jsonb;
  v_original jsonb;
  v_covered jsonb;
  v_capped jsonb;
begin
  if v_owner is null then raise exception 'Sign in before loading demo projects'; end if;
  if p_start_date is null or p_start_date < date '1900-01-01' or p_start_date + 34 > date '9999-12-31' then
    raise exception 'Choose a supported demo start date';
  end if;
  -- Serialise retries and concurrent clicks for this owner without locking other accounts.
  perform pg_advisory_xact_lock(hashtextextended('planner-demo:' || v_owner::text, 0));
  select project_id into v_project_id from public.demo_project_seeds where owner_id = v_owner and kind = 'showcase';
  if not found then
    insert into public.projects(owner_id, name, client_name, price_cents, starting_cash_cents, currency, start_date, end_date, tax_basis)
      values (v_owner, 'Demo · Website redesign', 'Sample Studio (fictional)', 1000000, 0, 'AUD', p_start_date, p_start_date + 28, 'inclusive')
      returning * into v_project;
    v_project_id := v_project.id;
    insert into public.demo_project_seeds values (v_owner, 'showcase', v_project_id);
    insert into public.expenses(project_id, description, amount_cents, payment_date) values
      (v_project_id, 'Design tools and materials', 300000, p_start_date + 4),
      (v_project_id, 'Specialist contractor', 150000, p_start_date + 12),
      (v_project_id, 'Build and testing labour', 250000, p_start_date + 19);
    insert into public.milestones(project_id, kind, name, amount_cents, completion_date, invoice_date, payment_terms_days)
      values (v_project_id, 'deposit', 'Booking deposit', 200000, p_start_date, p_start_date, 0) returning id into v_deposit_id;
    insert into public.milestones(project_id, kind, name, amount_cents, completion_date, invoice_date, payment_terms_days)
      values (v_project_id, 'milestone', 'Design approval', 300000, p_start_date + 6, p_start_date + 7, 7);
    insert into public.milestones(project_id, kind, name, amount_cents, completion_date, invoice_date, payment_terms_days, receipt_override_date, receipt_override_reason)
      values (v_project_id, 'milestone', 'Launch delivery', 500000, p_start_date + 18, p_start_date + 18, 7, p_start_date + 27,
        'Fictional client agreed to transfer the final payment two calendar days after its calculated receipt date.') returning id into v_final_id;
    v_baseline := jsonb_build_object('project', to_jsonb(v_project),
      'expenses', (select jsonb_agg(to_jsonb(e) order by e.id) from public.expenses e where e.project_id = v_project_id),
      'milestones', (select jsonb_agg(to_jsonb(m) order by m.id) from public.milestones m where m.project_id = v_project_id));
    v_original := jsonb_build_object('receiptDelayDays', 0, 'expenseIncreasePercent', 0, 'depositCapCents', 500000, 'changes', '[]'::jsonb);
    select id into v_original_id from public.save_plan_revision(v_project_id, '01 · Original payment terms', v_baseline, v_original, null);
    v_covered := jsonb_build_object('receiptDelayDays', 0, 'expenseIncreasePercent', 0, 'depositCapCents', 500000,
      'changes', jsonb_build_array(
        jsonb_build_object('id', v_deposit_id, 'amount_cents', 450000, 'receipt_date', p_start_date, 'reason', 'Move $2,500 from the launch payment into the booking deposit to cover early project costs.'),
        jsonb_build_object('id', v_final_id, 'amount_cents', 250000, 'receipt_date', p_start_date + 27, 'reason', 'Reduce the final payment by $2,500 to keep total client receipts at $10,000.')));
    select id into v_covered_id from public.save_plan_revision(v_project_id, '02 · Larger deposit', v_baseline, v_covered, v_original_id);
    v_capped := jsonb_build_object('receiptDelayDays', 0, 'expenseIncreasePercent', 0, 'depositCapCents', 350000,
      'changes', jsonb_build_array(
        jsonb_build_object('id', v_deposit_id, 'amount_cents', 350000, 'receipt_date', p_start_date, 'reason', 'The fictional client limits the deposit to $3,500, leaving some early costs unfunded.'),
        jsonb_build_object('id', v_final_id, 'amount_cents', 350000, 'receipt_date', p_start_date + 27, 'reason', 'Rebalance $1,500 into the deposit; the original total price is unchanged.')));
    perform public.save_plan_revision(v_project_id, '03 · Deposit capped at $3,500', v_baseline, v_capped, v_original_id);
    perform public.save_plan_revision(v_project_id, '04 · Seven days late + 10% costs', v_baseline,
      v_covered || jsonb_build_object('receiptDelayDays', 7, 'expenseIncreasePercent', 10), v_covered_id);
  end if;
  select project_id into v_project_id from public.demo_project_seeds where owner_id = v_owner and kind = 'draft';
  if not found then
    insert into public.projects(owner_id, name, client_name, price_cents, starting_cash_cents, currency, start_date, end_date, tax_basis)
      values (v_owner, 'Demo · Incomplete draft', 'Sample Client (fictional)', 800000, 100000, 'AUD', p_start_date, p_start_date + 21, 'exclusive') returning id into v_project_id;
    insert into public.demo_project_seeds values (v_owner, 'draft', v_project_id);
    insert into public.expenses(project_id, description, amount_cents, payment_date)
      values (v_project_id, 'Sample initial supplies', 180000, p_start_date + 3);
    insert into public.milestones(project_id, kind, name, amount_cents, completion_date, invoice_date, payment_terms_days)
      values (v_project_id, 'deposit', 'Draft booking deposit', 120000, p_start_date, p_start_date, 0);
  end if;
  return query select p.* from public.projects p join public.demo_project_seeds d on d.project_id = p.id
    where d.owner_id = v_owner order by case d.kind when 'showcase' then 0 else 1 end;
end;
$$;
revoke all on function public.load_demo_projects(date) from public, anon;
grant execute on function public.load_demo_projects(date) to authenticated;
