-- Private storage for project card images and detail photos/videos.
-- Run after 202610260001_initial_schema.sql.

alter table public.projects
  add column card_image_path text,
  add column additional_media_paths text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media',
  'project-media',
  false,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Students can upload media to their own project folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'project-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.current_app_role()) = 'student'
);

create policy "Approved project media and owners can view files"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'project-media'
  and exists (
    select 1
    from public.projects p
    where p.id::text = (storage.foldername(name))[2]
      and (
        p.status = 'approved'
        or p.submitted_by = (select auth.uid())
      )
  )
);

create policy "Students can remove their own uploaded project media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'project-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.current_app_role()) = 'student'
);
