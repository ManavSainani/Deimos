-- Allow administrators to change authorized user roles from the access list.
-- The existing authorized_users_sync_profile trigger updates an account's
-- profile role when an email has already created an account.

grant update (role) on table public.authorized_users to authenticated;

drop policy if exists "Admins can update authorized user roles"
on public.authorized_users;
create policy "Admins can update authorized user roles"
on public.authorized_users for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));
