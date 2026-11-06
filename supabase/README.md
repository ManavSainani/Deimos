# Supabase setup

This project uses Supabase Auth and Postgres. Guests can read approved projects,
students can submit projects, faculty can review projects, and admins can manage
the email authorization list. Database policies enforce these permissions.

## Create and configure the project

1. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the project, open **SQL Editor**, create a query, paste the contents of
   `migrations/202610260001_initial_schema.sql`, and run it.
3. Create another SQL Editor query, paste `migrations/202610260002_project_media.sql`,
   and run it to add private media storage and its access policies.
4. Create a third SQL Editor query, paste `migrations/202610260003_authorized_users.sql`,
   and run it to add admin accounts and the authorization list.
5. Create another SQL Editor query, paste `migrations/202611060001_pdf_archive_projects.sql`,
   and run it to add the PDF's 18 projects to the approved archive, including
   their team names and semester labels.
6. In **Project Settings → API**, copy the Project URL and the publishable key.
   The publishable key is intended for a browser app; never use a `service_role`
   or secret key in this project.
7. For local backend testing, copy `.env.example` to `.env.local` and set
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Omit or rename
   `.env.local` to use the local demo mode instead. Restart Vite after changing
   environment variables.
8. In Supabase **Authentication → URL Configuration**, set the Site URL to the
   deployed Pages URL and add the local development URL (normally
   `http://localhost:8443`) to the allowed redirect URLs.
9. In Cloudflare Pages, add the same two `VITE_` variables under the project’s
   **Settings → Variables and Secrets** for production (and preview, if used),
   then redeploy. Vite embeds these values at build time.

The repository’s `.nvmrc` selects Node.js 22 for local and Cloudflare builds.

The project archive's demo data comes from the 18 projects listed in
`src/data/past-projects.json`. With Supabase configured, the archive reads the
approved records seeded by the migration above, and newly submitted projects
enter `pending_review` until faculty approves them.

## Set up the first admin account

In the Supabase SQL Editor, authorize your own email as the first admin. Replace
the example address with the email you will use:

```sql
insert into public.authorized_users (email, role)
values (lower('admin@example.edu'), 'admin')
on conflict (email) do update set role = excluded.role;
```

If you already have an account with that email, sign in as **Admin**. Otherwise,
choose **Create account**, select **Admin**, and set a password with that same
email. The database creates the account only when the email is already in
`authorized_users` and assigns the role stored there. Admins can then add or
remove authorized student, faculty, and admin emails in the app. Faculty and
admin password setup follows the same rule: an admin must add the email to the
access list first. The app and database reject unlisted email addresses.

Supabase's **Confirm email** setting controls whether new users must confirm
their email after creating a password. It is a project-wide setting, not a
faculty/admin-only setting. With confirmation enabled, users must confirm before
they can sign in; disabling it applies to every role.

## Current backend behavior

- Guests and signed-in users can read approved project records.
- Students can submit projects and see their own submission statuses.
- Student submissions can include a card image and additional photos/videos.
- Project media is stored privately and becomes viewable through signed URLs
  only for approved projects or by the submitting student.
- Faculty accounts can see the review queue and approve submissions or request
  changes.
- Admin accounts can add or remove authorized email addresses. Removing an
  address revokes its student, faculty, or admin privileges; the last admin and
  the currently signed-in admin cannot remove themselves.
- The sample-data profile editor and archive-record management UI are still
  presentation-only and do not write to Supabase yet.
