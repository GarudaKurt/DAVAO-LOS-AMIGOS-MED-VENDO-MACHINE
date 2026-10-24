-- Temporary medicine activation state for the physical Vendo Medicine Machine.
-- Run after supabase/student_information.sql and supabase/dispensing_system.sql.

create table if not exists public.medicine_type (
  id uuid primary key default gen_random_uuid(),
  mefenamic_acid boolean not null default false,
  paracetamol_biogesic boolean not null default false,
  neozep boolean not null default false,
  kremel_s boolean not null default false,
  loperamide boolean not null default false,
  active_medicine_key text,
  active_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint medicine_type_single_row_id check (id = '00000000-0000-0000-0000-000000000001'::uuid),
  constraint medicine_type_active_key_check check (active_medicine_key in ('mefenamic-acid', 'paracetamol-biogesic', 'neozep', 'kremel-s', 'loperamide') or active_medicine_key is null)
);

alter table public.medicine_type
  add column if not exists active_medicine_key text;

alter table public.medicine_type
  add column if not exists active_until timestamptz;

insert into public.medicine_type (id)
values ('00000000-0000-0000-0000-000000000001'::uuid)
on conflict (id) do nothing;

create or replace function public.set_medicine_type_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists medicine_type_updated_at on public.medicine_type;
create trigger medicine_type_updated_at
before update on public.medicine_type
for each row execute function public.set_medicine_type_updated_at();

create or replace function public.reset_expired_medicine_type()
returns public.medicine_type
language plpgsql
security definer
set search_path = public
as $$
declare
  current_state public.medicine_type%rowtype;
begin
  select * into current_state
  from public.medicine_type
  where id = '00000000-0000-0000-0000-000000000001'::uuid
  for update;

  if current_state.active_until is not null and current_state.active_until <= timezone('utc', now()) then
    update public.medicine_type
    set mefenamic_acid = false,
        paracetamol_biogesic = false,
        neozep = false,
        kremel_s = false,
        loperamide = false,
        active_medicine_key = null,
        active_until = null
    where id = current_state.id
    returning * into current_state;
  end if;

  return current_state;
end;
$$;

revoke all on function public.reset_expired_medicine_type() from public;

create or replace function public.activate_medicine_type(p_medicine_key text)
returns public.medicine_type
language plpgsql
security definer
set search_path = public
as $$
declare
  current_state public.medicine_type%rowtype;
  expires_at timestamptz := timezone('utc', now()) + interval '6 seconds';
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only authorized administrators can activate a medicine';
  end if;

  if p_medicine_key not in ('mefenamic-acid', 'paracetamol-biogesic', 'neozep', 'kremel-s', 'loperamide') then
    raise exception 'Unknown medicine activation key';
  end if;

  select * into current_state from public.reset_expired_medicine_type();

  if current_state.active_medicine_key is not null then
    raise exception 'Another medicine is already active';
  end if;

  update public.medicine_type
  set mefenamic_acid = p_medicine_key = 'mefenamic-acid',
      paracetamol_biogesic = p_medicine_key = 'paracetamol-biogesic',
      neozep = p_medicine_key = 'neozep',
      kremel_s = p_medicine_key = 'kremel-s',
      loperamide = p_medicine_key = 'loperamide',
      active_medicine_key = p_medicine_key,
      active_until = expires_at
  where id = '00000000-0000-0000-0000-000000000001'::uuid
  returning * into current_state;

  return current_state;
end;
$$;

create or replace function public.get_medicine_type_status()
returns public.medicine_type
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only authorized administrators can view medicine activation status';
  end if;

  return public.reset_expired_medicine_type();
end;
$$;

alter table public.medicine_type enable row level security;

drop policy if exists "Admins view medicine activation status" on public.medicine_type;
create policy "Admins view medicine activation status" on public.medicine_type
  for select to authenticated using (public.is_admin());

revoke insert, update, delete on public.medicine_type from authenticated;
grant execute on function public.activate_medicine_type(text) to authenticated;
grant execute on function public.get_medicine_type_status() to authenticated;

-- Supabase pg_cron cleanup. Enable the Cron module in Supabase if it is not
-- already enabled. The expiration timestamp remains canonical and every
-- status read also resets an expired activation.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'medicine-type-expiration-cleanup',
      '1 second',
      $cron$select public.reset_expired_medicine_type();$cron$
    );
  end if;
exception when duplicate_object then
  null;
end;
$$;
