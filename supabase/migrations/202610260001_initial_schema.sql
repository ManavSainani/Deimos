-- Deimos archive: profiles, project submissions, and public approved records.
-- Run this migration in the Supabase SQL Editor or with the Supabase CLI.

create type public.app_role as enum ('student', 'faculty');
create type public.project_status as enum (
  'pending_review',
  'changes_requested',
  'approved',
  'rejected',
  'archived'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 180),
  category text not null,
  term text not null check (term in ('Spring', 'Fall', 'Summer')),
  academic_year integer not null check (academic_year between 2000 and 2200),
  description text not null check (length(trim(description)) between 1 and 10000),
  team_members text[] not null default '{}',
  technologies text[] not null default '{}',
  repository_url text,
  repository_access text not null default 'Public repository'
    check (repository_access in ('Public repository', 'University access')),
  status public.project_status not null default 'pending_review',
  submitted_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);

create index projects_public_archive_idx
  on public.projects (academic_year desc, created_at desc)
  where status = 'approved';
create index projects_submitter_idx on public.projects (submitted_by, created_at desc);
create index projects_review_queue_idx on public.projects (created_at)
  where status in ('pending_review', 'changes_requested');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- Account role is assigned by the database. User-provided signup metadata cannot
-- grant faculty privileges; a project admin promotes faculty from the dashboard.
create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger auth_user_created_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

-- RLS policies use this narrowly scoped helper to check staff permissions
-- without recursively querying profiles from its own RLS policy.
create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to anon, authenticated;

-- Prevent users from editing their own role in the client.
create function public.prevent_self_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role is distinct from new.role and auth.uid() = old.id then
    raise exception 'Users cannot change their own account role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_role_change
before update on public.profiles
for each row execute function public.prevent_self_role_change();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

grant usage on schema public to anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select on table public.projects to anon, authenticated;
grant insert, update on table public.projects to authenticated;

create policy "Users can read their own profile; faculty can read all profiles"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id or (select public.current_app_role()) = 'faculty');

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Public can read approved projects"
on public.projects for select
to anon, authenticated
using (
  status = 'approved'
  or (select auth.uid()) = submitted_by
  or (select public.current_app_role()) = 'faculty'
);

create policy "Students can submit projects for their own account"
on public.projects for insert
to authenticated
with check (
  (select auth.uid()) = submitted_by
  and (select public.current_app_role()) = 'student'
  and status = 'pending_review'
);

create policy "Faculty can update project review status"
on public.projects for update
to authenticated
using ((select public.current_app_role()) = 'faculty')
with check ((select public.current_app_role()) = 'faculty');
