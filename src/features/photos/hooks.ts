import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/features/auth/SessionProvider';
import type { PickedImage } from './imagePicker';

const BUCKET = 'club-photos';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // mismo límite que el bucket
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Sube una foto ya saneada (JPEG sin EXIF) al bucket privado, dentro de la
 * carpeta del usuario: {user_id}/{club_id}/{uuid}.jpg. Las políticas de
 * Storage rechazan cualquier ruta fuera de esa carpeta.
 */
export async function uploadClubPhoto(options: {
  userId: string;
  clubId: string;
  image: PickedImage;
  isPrimary: boolean;
}): Promise<void> {
  const { userId, clubId, image, isPrimary } = options;

  const file = new File(image.uri);
  const bytes = await file.bytes();

  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error('La foto supera el máximo de 5 MB.');
  }

  const storagePath = `${userId}/${clubId}/${Crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('club_photos').insert({
    club_id: clubId,
    user_id: userId,
    storage_path: storagePath,
    is_primary: isPrimary,
  });
  if (insertError) {
    // No dejamos archivos huérfanos si la fila no se pudo crear.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw insertError;
  }
}

export function useDeletePhoto() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: { id: string; storage_path: string }) => {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([photo.storage_path]);
      if (storageError) throw storageError;

      const { error } = await supabase.from('club_photos').delete().eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clubs', userId] });
      void queryClient.invalidateQueries({ queryKey: ['club', userId] });
    },
  });
}

/**
 * URLs firmadas y temporales para mostrar fotos del bucket privado.
 * Se cachean menos tiempo que su expiración para no mostrar enlaces muertos.
 */
export function useSignedPhotoUrls(paths: string[]) {
  const userId = useUserId();
  const sorted = [...paths].sort();

  return useQuery({
    queryKey: ['photo-urls', userId, sorted],
    enabled: paths.length > 0,
    staleTime: (SIGNED_URL_TTL_SECONDS - 10 * 60) * 1000,
    gcTime: (SIGNED_URL_TTL_SECONDS - 10 * 60) * 1000,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(sorted, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;

      const byPath: Record<string, string> = {};
      for (const entry of data) {
        if (entry.signedUrl && entry.path) {
          byPath[entry.path] = entry.signedUrl;
        }
      }
      return byPath;
    },
  });
}
