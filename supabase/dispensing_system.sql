-- Medicine dispensing system migration.
-- Run after supabase/student_information.sql.

create table if not exists public.dispensing_settings (
  id boolean primary key default true check (id = true),
  daily_limit smallint not null default 2 check (daily_limit between 2 and 3),
  timezone_name text not null default 'Asia/Manila',
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id)
);

insert into public.dispensing_settings (id, daily_limit, timezone_name)
values (true, 2, 'Asia/Manila')
on conflict (id) do nothing;

create table if not exists public.medicine_inventory (
  id uuid primary key default gen_random_uuid(),
  medicine_key text not null unique,
  name text not null unique,
  image_path text not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.medicine_inventory
  add column if not exists low_stock_threshold integer not null default 5;

alter table public.medicine_inventory
  drop constraint if exists medicine_inventory_low_stock_threshold_check;

alter table public.medicine_inventory
  add constraint medicine_inventory_low_stock_threshold_check check (low_stock_threshold >= 0);

insert into public.medicine_inventory (medicine_key, name, image_path)
values
  ('mefenamic-acid', 'Mefenamic Acid', '/img/img_1.jpg'),
  ('paracetamol-biogesic', 'Paracetamol Biogesic', '/img/img_3.jpg'),
  ('neozep', 'Neozep', '/img/img_4.jpg'),
  ('kremel-s', 'Kremel-S', '/img/img_6.jpg'),
  ('loperamide', 'Loperamide', '/img/img_5.png')
on conflict (medicine_key) do update set image_path = excluded.image_path;

create table if not exists public.dispensing_transactions (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references auth.users(id) on delete restrict,
  medicine_id uuid not null references public.medicine_inventory(id) on delete restrict,
  student_name text not null,
  grade smallint not null check (grade between 1 and 12),
  section text not null,
  dispensed_by uuid not null references auth.users(id) on delete restrict,
  dispensed_at timestamptz not null default timezone('utc', now()),
  request_id uuid not null default gen_random_uuid() unique,
  local_dispense_date date generated always as ((dispensed_at at time zone 'Asia/Manila')::date) stored
);

alter table public.dispensing_transactions
  add column if not exists request_id uuid default gen_random_uuid();

update public.dispensing_transactions
set request_id = gen_random_uuid()
where request_id is null;

alter table public.dispensing_transactions
  alter column request_id set not null;

create unique index if not exists dispensing_transactions_request_id_idx
  on public.dispensing_transactions (request_id);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('inventory_adjustment', 'medicine_dispensed', 'daily_limit_updated')),
  medicine_id uuid references public.medicine_inventory(id) on delete set null,
  transaction_id uuid references public.dispensing_transactions(id) on delete set null,
  quantity_delta integer,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_admin_user_idx
  on public.admin_audit_logs (admin_user_id);

create index if not exists dispensing_transactions_student_date_idx
  on public.dispensing_transactions (student_user_id, local_dispense_date);

create index if not exists dispensing_transactions_dispensed_at_idx
  on public.dispensing_transactions (dispensed_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

drop policy if exists "Admins can view student information for dispensing" on public.student_information;
create policy "Admins can view student information for dispensing"
  on public.student_information for select to authenticated
  using (public.is_admin());

create or replace function public.get_student_dispensing_status(p_student_user_id uuid)
returns table (dispensed_today integer, daily_limit integer, remaining_today integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_limit integer;
  used_today integer;
begin
  if auth.uid() is null or (auth.uid() <> p_student_user_id and not public.is_admin()) then
    raise exception 'Not authorized to view this student''s dispensing status';
  end if;

  select s.daily_limit into current_limit
  from public.dispensing_settings s
  where s.id = true;

  select count(*)::integer into used_today
  from public.dispensing_transactions t
  where t.student_user_id = p_student_user_id
    and t.local_dispense_date = (timezone('Asia/Manila', now()))::date;

  return query select used_today, current_limit, greatest(current_limit - used_today, 0);
end;
$$;

create or replace function public.dispense_medicine(
  p_student_user_id uuid,
  p_medicine_id uuid
)
returns public.dispensing_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  current_limit integer;
  used_today integer;
  student_record public.student_information%rowtype;
  medicine_record public.medicine_inventory%rowtype;
  transaction_record public.dispensing_transactions%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only authorized administrators can dispense medicine';
  end if;

  -- Lock the settings row so concurrent requests cannot bypass the limit.
  select s.daily_limit into current_limit
  from public.dispensing_settings s
  where s.id = true
  for update;

  select * into student_record
  from public.student_information s
  where s.user_id = p_student_user_id;
  if not found then raise exception 'Student information was not found'; end if;

  select count(*)::integer into used_today
  from public.dispensing_transactions t
  where t.student_user_id = p_student_user_id
    and t.local_dispense_date = (timezone('Asia/Manila', now()))::date;
  if used_today >= current_limit then raise exception 'The student has reached today''s dispensing limit'; end if;

  update public.medicine_inventory
  set stock_quantity = stock_quantity - 1,
      updated_at = timezone('utc', now())
  where id = p_medicine_id and is_active = true and stock_quantity > 0
  returning * into medicine_record;
  if not found then raise exception 'This medicine is unavailable or out of stock'; end if;

  insert into public.dispensing_transactions (student_user_id, medicine_id, student_name, grade, section, dispensed_by)
  values (student_record.user_id, medicine_record.id, student_record.full_name, student_record.grade, student_record.section, auth.uid())
  returning * into transaction_record;

  insert into public.admin_audit_logs (admin_user_id, action, medicine_id, transaction_id, quantity_delta, details)
  values (auth.uid(), 'medicine_dispensed', medicine_record.id, transaction_record.id, -1,
    jsonb_build_object('student_user_id', student_record.user_id, 'student_name', student_record.full_name));

  return transaction_record;
end;
$$;

create or replace function public.adjust_inventory(
  p_medicine_id uuid,
  p_quantity_delta integer,
  p_reason text default null
)
returns public.medicine_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_medicine public.medicine_inventory%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only authorized administrators can adjust inventory';
  end if;

  if p_quantity_delta = 0 then
    raise exception 'Inventory adjustment cannot be zero';
  end if;

  update public.medicine_inventory
  set stock_quantity = stock_quantity + p_quantity_delta,
      updated_at = timezone('utc', now())
  where id = p_medicine_id
    and stock_quantity + p_quantity_delta >= 0
  returning * into updated_medicine;

  if not found then
    raise exception 'Medicine was not found or the adjustment would create negative stock';
  end if;

  insert into public.admin_audit_logs (admin_user_id, action, medicine_id, quantity_delta, details)
  values (auth.uid(), 'inventory_adjustment', updated_medicine.id, p_quantity_delta,
    jsonb_build_object('reason', coalesce(nullif(trim(p_reason), ''), 'Manual stock adjustment'), 'stock_after', updated_medicine.stock_quantity));

  return updated_medicine;
end;
$$;

create or replace function public.get_admin_dashboard_stats()
returns table (
  registered_students bigint,
  available_medicines bigint,
  dispensing_transactions bigint,
  low_stock_items bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only authorized administrators can view dashboard statistics';
  end if;

  return query
  select
    (select count(*) from public.student_information),
    (select count(*) from public.medicine_inventory where is_active = true),
    (select count(*) from public.dispensing_transactions),
    (select count(*) from public.medicine_inventory where is_active = true and stock_quantity <= low_stock_threshold);
end;
$$;

alter table public.dispensing_settings enable row level security;
alter table public.medicine_inventory enable row level security;
alter table public.dispensing_transactions enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins manage dispensing settings" on public.dispensing_settings;
create policy "Admins manage dispensing settings" on public.dispensing_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users view active medicines" on public.medicine_inventory;
create policy "Authenticated users view active medicines" on public.medicine_inventory
  for select to authenticated using (is_active = true or public.is_admin());

drop policy if exists "Admins manage medicine inventory" on public.medicine_inventory;
revoke insert, update, delete on public.medicine_inventory from authenticated;

drop policy if exists "Students view their own dispensing history" on public.dispensing_transactions;
create policy "Students view their own dispensing history" on public.dispensing_transactions
  for select to authenticated using (student_user_id = auth.uid() or public.is_admin());

revoke insert, update, delete on public.dispensing_transactions from authenticated;
grant execute on function public.get_student_dispensing_status(uuid) to authenticated;
grant execute on function public.dispense_medicine(uuid, uuid) to authenticated;
grant execute on function public.adjust_inventory(uuid, integer, text) to authenticated;
grant execute on function public.get_admin_dashboard_stats() to authenticated;

drop policy if exists "Admins view audit logs" on public.admin_audit_logs;
create policy "Admins view audit logs" on public.admin_audit_logs
  for select to authenticated using (public.is_admin());

revoke insert, update, delete on public.admin_audit_logs from authenticated;
