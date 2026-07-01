import { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useClub, useDeleteClub } from '@/features/clubs/hooks';
import { useDeletePhoto, useSignedPhotoUrls } from '@/features/photos/hooks';
import { categoryLabel, conditionLabel } from '@/features/clubs/schemas';
import { Button } from '@/shared/ui/Button';
import { EmptyView, ErrorView, LoadingView } from '@/shared/ui/StateViews';
import { colors, radius, spacing, typography } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = SCREEN_WIDTH - spacing.md * 2;

function DataRow({ label, value }: { label: string; value: string | null }) {
  if (value === null || value === '') return null;
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const clubQuery = useClub(id);
  const deleteClub = useDeleteClub();
  const deletePhoto = useDeletePhoto();
  const [activePhoto, setActivePhoto] = useState(0);

  const club = clubQuery.data;
  const photos = useMemo(() => {
    if (!club) return [];
    return [...club.club_photos].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  }, [club]);

  const { data: photoUrls } = useSignedPhotoUrls(photos.map((photo) => photo.storage_path));

  if (clubQuery.isLoading) {
    return <LoadingView />;
  }
  if (clubQuery.isError) {
    return <ErrorView onRetry={() => void clubQuery.refetch()} />;
  }
  if (!club) {
    return (
      <EmptyView
        title="Palo no encontrado"
        message="Puede que lo hayas eliminado."
        actionTitle="Volver"
        onAction={() => router.back()}
      />
    );
  }

  function handleDeleteClub() {
    if (!club) return;
    Alert.alert(
      'Eliminar palo',
      `Se eliminará "${club.brand} ${club.model}" con todas sus fotos. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteClub.mutate(club, {
              onSuccess: () => router.back(),
              onError: () => Alert.alert('Error', 'No pudimos eliminar el palo. Inténtalo de nuevo.'),
            });
          },
        },
      ],
    );
  }

  function handleDeletePhoto(photo: (typeof photos)[number]) {
    Alert.alert('Eliminar foto', '¿Quieres eliminar esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          setActivePhoto(0);
          deletePhoto.mutate(photo, {
            onError: () => Alert.alert('Error', 'No pudimos eliminar la foto.'),
          });
        },
      },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={styles.navButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar palo"
          onPress={() => router.push(`/(app)/club/${club.id}/edit`)}
          style={styles.navButton}
        >
          <Ionicons name="create-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {photos.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) =>
                setActivePhoto(Math.round(event.nativeEvent.contentOffset.x / PHOTO_SIZE))
              }
            >
              {photos.map((photo) => {
                const url = photoUrls?.[photo.storage_path];
                return (
                  <View key={photo.id} style={styles.photoSlide}>
                    {url !== undefined ? (
                      <Image source={{ uri: url }} style={styles.photo} contentFit="cover" transition={150} />
                    ) : (
                      <View style={[styles.photo, styles.photoPlaceholder]}>
                        <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
                      </View>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Eliminar foto"
                      onPress={() => handleDeletePhoto(photo)}
                      style={styles.photoDelete}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </Pressable>
                    {photo.is_primary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Principal</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            {photos.length > 1 && (
              <View style={styles.dots}>
                {photos.map((photo, index) => (
                  <View
                    key={photo.id}
                    style={[styles.dot, index === activePhoto && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
            <Text style={styles.noPhotos}>Sin fotos — añádelas desde “Editar”</Text>
          </View>
        )}

        <View style={styles.titleBlock}>
          <Text style={styles.category}>{categoryLabel(club.category)}</Text>
          <Text style={styles.title}>
            {club.brand} {club.model}
          </Text>
        </View>

        {club.serial_number !== null && (
          <View style={styles.serialCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.gold} />
            <View style={styles.serialText}>
              <Text style={styles.serialLabel}>Número de serie</Text>
              <Text style={styles.serialValue}>{club.serial_number}</Text>
            </View>
          </View>
        )}

        <View style={styles.dataCard}>
          <DataRow label="Estado" value={conditionLabel(club.condition)} />
          <DataRow label="Loft" value={club.loft !== null ? `${club.loft}°` : null} />
          <DataRow label="Flex del shaft" value={club.shaft_flex} />
          <DataRow label="Material del shaft" value={club.shaft_material} />
          <DataRow label="Fecha de compra" value={club.purchase_date} />
          <DataRow
            label="Valor estimado"
            value={club.estimated_value !== null ? `$${club.estimated_value.toLocaleString('es')}` : null}
          />
          <DataRow label="Notas" value={club.notes} />
          <DataRow label="Registrado" value={new Date(club.created_at).toLocaleDateString('es')} />
        </View>

        <Button
          title="Eliminar palo"
          variant="danger"
          onPress={handleDeleteClub}
          loading={deleteClub.isPending}
          style={styles.deleteButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  photoSlide: {
    width: PHOTO_SIZE,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  noPhotos: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  photoDelete: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onAccent,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  titleBlock: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  category: {
    ...typography.label,
    color: colors.accent,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  serialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  serialText: {
    flex: 1,
  },
  serialLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  serialValue: {
    ...typography.headline,
    color: colors.gold,
    marginTop: 2,
  },
  dataCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  dataLabel: {
    ...typography.callout,
    color: colors.textSecondary,
  },
  dataValue: {
    ...typography.callout,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  deleteButton: {
    marginBottom: spacing.lg,
  },
});
