import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/features/auth/SessionProvider';
import type { Bag } from '@/lib/database.types';

/**
 * La bolsa del usuario (hoy: una por usuario; el esquema soporta varias).
 * Devuelve null si aún no creó ninguna — eso dispara el onboarding.
 */
export function useBag() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['bag', userId],
    queryFn: async (): Promise<Bag | null> => {
      const { data, error } = await supabase
        .from('bags')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBag() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string): Promise<Bag> => {
      const { data, error } = await supabase
        .from('bags')
        .insert({ user_id: userId, name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bag', userId] });
    },
  });
}
