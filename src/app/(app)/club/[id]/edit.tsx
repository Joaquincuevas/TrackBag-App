import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useClub, useUpdateClub } from '@/features/clubs/hooks';
import { ClubForm } from '@/features/clubs/ClubForm';
import { PhotoPicker } from '@/features/photos/PhotoPicker';
import { uploadClubPhoto } from '@/features/photos/hooks';
import { useUserId } from '@/features/auth/SessionProvider';
import type { PickedImage } from '@/features/photos/imagePicker';
import type { ClubFormOutput } from '@/features/clubs/schemas';
import { Screen } from '@/shared/ui/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/shared/ui/StateViews';
import { colors, spacing, typography } from '@/theme';

export default function EditClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const queryClient = useQueryClient();
  const clubQuery = useClub(id);
  const updateClub = useUpdateClub(id);

  const [newPhotos, setNewPhotos] = useState<PickedImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (clubQuery.isLoading) {
    return <LoadingView />;
  }
  if (clubQuery.isError) {
    return <ErrorView onRetry={() => void clubQuery.refetch()} />;
  }
  const club = clubQuery.data;
  if (!club) {
    return <EmptyView title="Palo no encontrado" message="Puede que lo hayas eliminado." />;
  }

  async function handleSubmit(form: ClubFormOutput) {
    if (!club) return;
    setFormError(null);
    setSaving(true);
    try {
      await updateClub.mutateAsync(form);

      const hasPrimary = club.club_photos.some((photo) => photo.is_primary);
      let failed = 0;
      for (const [index, image] of newPhotos.entries()) {
        try {
          await uploadClubPhoto({
            userId,
            clubId: club.id,
            image,
            isPrimary: !hasPrimary && club.club_photos.length === 0 && index === 0,
          });
        } catch {
          failed += 1;
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['club', userId, club.id] });
      void queryClient.invalidateQueries({ queryKey: ['clubs', userId] });

      if (failed > 0) {
        Alert.alert('Cambios guardados', `${failed} foto(s) nueva(s) no se pudieron subir.`);
      }
      router.back();
    } catch {
      setFormError('No pudimos guardar los cambios. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Editar palo</Text>
        <Text style={styles.subtitle}>
          {club.club_photos.length} foto(s) actuales — gestiónalas desde el detalle. Aquí puedes
          añadir nuevas.
        </Text>
      </View>

      <ClubForm
        initial={club}
        submitLabel="Guardar cambios"
        submitting={saving}
        formError={formError}
        onSubmit={(form) => void handleSubmit(form)}
      >
        <PhotoPicker
          photos={newPhotos}
          onAdd={(image) => setNewPhotos((current) => [...current, image])}
          onRemove={(index) => setNewPhotos((current) => current.filter((_, i) => i !== index))}
          disabled={saving}
        />
      </ClubForm>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});
