import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/features/auth/SessionProvider';
import type { Profile } from '@/lib/database.types';

export function useProfile() {
  const userId = useUserId();

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: { full_name?: string; phone?: string | null; handicap?: number | null }) => {
      const { error } = await supabase.from('profiles').update(update).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
