-- TrackBag — Storage privado para fotos de palos
-- Bucket PRIVADO: las fotos solo se sirven con URLs firmadas y cada usuario
-- solo puede operar dentro de su propia carpeta {user_id}/...

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'club-photos',
  'club-photos',
  false,                          -- privado, nunca público
  5242880,                        -- 5 MB máximo por foto (también validado en el cliente)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Cada archivo vive en {user_id}/{club_id}/{uuid}.jpg
-- (storage.foldername(name))[1] es el primer segmento de la ruta.

create policy "club_photos_storage_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'club-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "club_photos_storage_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'club-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "club_photos_storage_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'club-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'club-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "club_photos_storage_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'club-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
