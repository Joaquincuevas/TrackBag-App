import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/features/auth/SessionProvider';
import type { Club, ClubPhoto } from '@/lib/database.types';
import type { ClubFormOutput } from './schemas';

export type ClubWithPhotos = Club & { club_photos: ClubPhoto[] };

function toRow(form: ClubFormOutput) {
  return {
    category: form.category,
    brand: form.brand,
    model: form.model,
    loft: form.loft,
    shaft_flex: form.shaftFlex,
    shaft_material: form.shaftMaterial,
    serial_number: form.serialNumber,
    condition: form.condition,
    purchase_date: form.purchaseDate,
    estimated_value: form.estimatedValue,
    notes: form.notes,
  };
}

/** Todos los palos de la bolsa, con sus fotos. */
export function useClubs(bagId: string | undefined) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['clubs', userId, bagId],
    enabled: bagId !== undefined,
    queryFn: async (): Promise<ClubWithPhotos[]> => {
      const { data, error } = await supabase
        .from('clubs')
        .select('*, club_photos(*)')
        .eq('bag_id', bagId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ClubWithPhotos[];
    },
  });
}

export function useClub(clubId: string) {
  const userId = useUserId();

  return useQuery({
    queryKey: ['club', userId, clubId],
    queryFn: async (): Promise<ClubWithPhotos | null> => {
      const { data, error } = await supabase
        .from('clubs')
        .select('*, club_photos(*)')
        .eq('id', clubId)
        .maybeSingle();
      if (error) throw error;
      return data as ClubWithPhotos | null;
    },
  });
}

export function useCreateClub(bagId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: ClubFormOutput): Promise<Club> => {
      const { data, error } = await supabase
        .from('clubs')
        .insert({ ...toRow(form), bag_id: bagId, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clubs', userId] });
    },
  });
}

export function useUpdateClub(clubId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: ClubFormOutput) => {
      const { error } = await supabase.from('clubs').update(toRow(form)).eq('id', clubId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clubs', userId] });
      void queryClient.invalidateQueries({ queryKey: ['club', userId, clubId] });
    },
  });
}

export function useDeleteClub() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (club: ClubWithPhotos) => {
      // Primero los archivos de Storage (la fila cae en cascada con las fotos).
      if (club.club_photos.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('club-photos')
          .remove(club.club_photos.map((photo) => photo.storage_path));
        if (storageError) throw storageError;
      }
      const { error } = await supabase.from('clubs').delete().eq('id', club.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clubs', userId] });
    },
  });
}
