import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useBag } from '@/features/bags/hooks';
import { useCreateClub } from '@/features/clubs/hooks';
import { ClubForm } from '@/features/clubs/ClubForm';
import { PhotoPicker } from '@/features/photos/PhotoPicker';
import { uploadClubPhoto } from '@/features/photos/hooks';
import { useUserId } from '@/features/auth/SessionProvider';
import type { PickedImage } from '@/features/photos/imagePicker';
import type { ClubFormOutput } from '@/features/clubs/schemas';
import { Screen } from '@/shared/ui/Screen';
import { LoadingView } from '@/shared/ui/StateViews';
import { colors, spacing, typography } from '@/theme';

export default function NewClubScreen() {
  const userId = useUserId();
  const { data: bag } = useBag();
  const queryClient = useQueryClient();
  const createClub = useCreateClub(bag?.id ?? '');

  const [photos, setPhotos] = useState<PickedImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!bag) {
    return <LoadingView />;
  }

  async function handleSubmit(form: ClubFormOutput) {
    setFormError(null);
    setSaving(true);
    try {
      const club = await createClub.mutateAsync(form);

      // Subimos las fotos en cola; la primera queda como principal.
      let failed = 0;
      for (const [index, image] of photos.entries()) {
        try {
          await uploadClubPhoto({ userId, clubId: club.id, image, isPrimary: index === 0 });
        } catch {
          failed += 1;
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['clubs', userId] });

      if (failed > 0) {
        Alert.alert(
          'Palo guardado',
          `El palo se registró, pero ${failed} foto(s) no se pudieron subir. Puedes agregarlas desde el detalle.`,
        );
      }
      router.back();
    } catch {
      setFormError('No pudimos guardar el palo. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Nuevo palo</Text>
        <Text style={styles.subtitle}>Fotos + número de serie = inventario con valor de prueba.</Text>
      </View>

      <ClubForm
        submitLabel="Guardar palo"
        submitting={saving}
        formError={formError}
        onSubmit={(form) => void handleSubmit(form)}
      >
        <PhotoPicker
          photos={photos}
          onAdd={(image) => setPhotos((current) => [...current, image])}
          onRemove={(index) => setPhotos((current) => current.filter((_, i) => i !== index))}
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
  },
});
