import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBag } from '@/features/bags/hooks';
import { useClubs, type ClubWithPhotos } from '@/features/clubs/hooks';
import { useSignedPhotoUrls } from '@/features/photos/hooks';
import { useProfile } from '@/features/profile/hooks';
import { exportBagReport } from '@/features/report/generateReport';
import { categoryLabel } from '@/features/clubs/schemas';
import { EmptyView, ErrorView, LoadingView } from '@/shared/ui/StateViews';
import { colors, radius, spacing, typography } from '@/theme';

const COMPETITION_MAX_CLUBS = 14;

function primaryPhotoPath(club: ClubWithPhotos): string | null {
  const primary = club.club_photos.find((photo) => photo.is_primary) ?? club.club_photos[0];
  return primary?.storage_path ?? null;
}

export default function MyBagScreen() {
  const insets = useSafeAreaInsets();
  const { data: bag } = useBag();
  const { data: profile } = useProfile();
  const clubsQuery = useClubs(bag?.id);
  const clubs = useMemo(() => clubsQuery.data ?? [], [clubsQuery.data]);

  const photoPaths = useMemo(
    () => clubs.map(primaryPhotoPath).filter((path): path is string => path !== null),
    [clubs],
  );
  const { data: photoUrls } = useSignedPhotoUrls(photoPaths);

  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!bag || !profile || clubs.length === 0) return;
    setExporting(true);
    try {
      await exportBagReport({ profile, bag, clubs });
    } catch {
      Alert.alert('Error', 'No pudimos generar el reporte. Inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  }

  if (clubsQuery.isLoading) {
    return <LoadingView message="Cargando tus palos…" />;
  }
  if (clubsQuery.isError) {
    return <ErrorView onRetry={() => void clubsQuery.refetch()} />;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{bag?.name ?? 'Mi Bolsa'}</Text>
          <Text style={styles.subtitle}>
            {clubs.length} {clubs.length === 1 ? 'palo' : 'palos'} · máx. {COMPETITION_MAX_CLUBS} en
            competición
          </Text>
        </View>
        {clubs.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exportar reporte"
            onPress={handleExport}
            disabled={exporting}
            style={({ pressed }) => [styles.exportButton, (pressed || exporting) && { opacity: 0.6 }]}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.accent} />
          </Pressable>
        )}
      </View>

      {clubs.length === 0 ? (
        <EmptyView
          icon="⛳️"
          title="Aún no tienes palos"
          message="Registra cada palo con fotos y número de serie. Es tu inventario y tu prueba ante un robo."
          actionTitle="Agregar mi primer palo"
          onAction={() => router.push('/(app)/club/new')}
        />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(club) => club.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.list, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const path = primaryPhotoPath(item);
            const url = path !== null ? photoUrls?.[path] : undefined;
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/(app)/club/${item.id}`)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
              >
                {url !== undefined ? (
                  <Image source={{ uri: url }} style={styles.cardImage} contentFit="cover" transition={150} />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Ionicons name="image-outline" size={28} color={colors.textTertiary} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardCategory}>{categoryLabel(item.category)}</Text>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.brand} {item.model}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {clubs.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar palo"
          onPress={() => router.push('/(app)/club/new')}
          style={({ pressed }) => [
            styles.fab,
            { bottom: spacing.lg + insets.bottom },
            pressed && { backgroundColor: colors.accentPressed },
          ]}
        >
          <Ionicons name="add" size={26} color={colors.onAccent} />
          <Text style={styles.fabLabel}>Agregar palo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingTop: spacing.sm,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceElevated,
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: spacing.md,
  },
  cardCategory: {
    ...typography.label,
    color: colors.accent,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.callout,
    color: colors.text,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabLabel: {
    ...typography.headline,
    color: colors.onAccent,
  },
});
