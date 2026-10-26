-- Admin-managed email authorization for Deimos accounts.
-- Run after the schema and project-media migrations.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create table if not exists public.authorized_users (
  email text primary key check (
    email = lower(email)
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  role text not null check (role in ('student', 'faculty', 'admin')),
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

insert into public.authorized_users (email, role)
select
  lower(u.email),
  case when p.role = 'faculty' then 'faculty' else 'student' end
from auth.users u
join public.profiles p on p.id = u.id
where u.email is not null
on conflict (email) do nothing;

alter table public.authorized_users enable row level security;
revoke all on table public.authorized_users from public, anon, authenticated;
grant select, insert, delete on table public.authorized_users to authenticated;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  join auth.users u on u.id = p.id
  join public.authorized_users a on a.email = lower(u.email)
  where p.id = (select auth.uid())
    and a.role <> 'admin';
$$;

revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    join public.authorized_users a on a.email = lower(u.email)
    where p.id = (select auth.uid())
      and p.is_admin
      and a.role = 'admin'
  );
$$;

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists "Users can read their own authorization; admins can read all"
on public.authorized_users;
create policy "Users can read their own authorization; admins can read all"
on public.authorized_users for select
to authenticated
using (
  email = lower((select auth.jwt() ->> 'email'))
  or (select public.current_user_is_admin())
);

drop policy if exists "Admins can add authorized users"
on public.authorized_users;
create policy "Admins can add authorized users"
on public.authorized_users for insert
to authenticated
with check ((select public.current_user_is_admin()));

drop policy if exists "Admins can remove other authorized users"
on public.authorized_users;
create policy "Admins can remove other authorized users"
on public.authorized_users for delete
to authenticated
using (
  (select public.current_user_is_admin())
  and email <> lower((select auth.jwt() ->> 'email'))
);

-- The allowlist is the source of truth for runtime roles, so a removed address
-- immediately loses student, faculty, and administrator privileges in RLS.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  authorized_role text;
begin
  select role into authorized_role
  from public.authorized_users
  where email = lower(new.email);

  if authorized_role is null then
    raise exception 'This email address is not authorized to create a Deimos account.';
  end if;

  insert into public.profiles (id, full_name, role, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when authorized_role = 'faculty' then 'faculty'::public.app_role
      else 'student'::public.app_role end,
    authorized_role = 'admin'
  );
  return new;
end;
$$;

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.id = auth.uid()
    and current_setting('deimos.authorization_sync', true) is distinct from 'on'
    and (
      old.role is distinct from new.role
      or old.is_admin is distinct from new.is_admin
    ) then
    raise exception 'Users cannot change their own account permissions';
  end if;
  return new;
end;
$$;

create or replace function public.sync_authorized_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('deimos.authorization_sync', 'on', true);
  update public.profiles p
  set role = case when new.role = 'faculty' then 'faculty'::public.app_role
    else 'student'::public.app_role end,
      is_admin = (new.role = 'admin')
  from auth.users u
  where u.id = p.id
    and lower(u.email) = new.email;
  return new;
end;
$$;

drop trigger if exists authorized_users_sync_profile on public.authorized_users;
create trigger authorized_users_sync_profile
after insert or update of role on public.authorized_users
for each row execute function public.sync_authorized_user_profile();

create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin'
    and (select count(*) from public.authorized_users where role = 'admin') <= 1 then
    raise exception 'The last administrator cannot be removed.';
  end if;
  return old;
end;
$$;

drop trigger if exists authorized_users_preserve_admin on public.authorized_users;
create trigger authorized_users_preserve_admin
before delete on public.authorized_users
for each row execute function public.prevent_last_admin_removal();
