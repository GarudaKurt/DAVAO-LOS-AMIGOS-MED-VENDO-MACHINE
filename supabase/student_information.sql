-- Dedicated Student Information table.
-- Run this in Supabase Dashboard → SQL Editor.

create table if not exists public.student_information (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  grade smallint not null check (grade between 1 and 12),
  section text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.student_information enable row level security;

drop policy if exists "Students can view their own information" on public.student_information;
create policy "Students can view their own information"
  on public.student_information for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Students can create their own information" on public.student_information;
create policy "Students can create their own information"
  on public.student_information for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Students can update their own information" on public.student_information;
create policy "Students can update their own information"
  on public.student_information for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can view student information" on public.student_information;
create policy "Admins can view student information"
  on public.student_information for select to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

create or replace function public.set_student_information_updated_at()
returns trigger language plpgsql security invoker as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists student_information_updated_at on public.student_information;
create trigger student_information_updated_at
before update on public.student_information
for each row execute function public.set_student_information_updated_at();
