import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, spacing, typography } from '@/theme';
import { pickFromGallery, takePhoto, type PickedImage } from './imagePicker';

type Props = {
  photos: PickedImage[];
  onAdd: (image: PickedImage) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
};

/**
 * Selector de fotos para el alta de un palo: cámara o galería, con
 * previsualización y borrado. Las imágenes ya llegan saneadas (sin EXIF).
 */
export function PhotoPicker({ photos, onAdd, onRemove, disabled = false }: Props) {
  async function handleAdd(source: 'camera' | 'gallery') {
    try {
      const image = source === 'camera' ? await takePhoto() : await pickFromGallery();
      if (image) onAdd(image);
    } catch {
      Alert.alert('Error', 'No pudimos procesar la foto. Inténtalo de nuevo.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fotos</Text>
      <Text style={styles.hint}>
        Toma varias: el palo completo y un detalle del número de serie. La primera será la foto
        principal.
      </Text>

      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
          {photos.map((photo, index) => (
            <View key={photo.uri} style={styles.thumbWrapper}>
              <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
              {index === 0 && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Principal</Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar foto"
                onPress={() => onRemove(index)}
                disabled={disabled}
                style={styles.removeButton}
              >
                <Ionicons name="close" size={14} color={colors.text} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleAdd('camera')}
          disabled={disabled}
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="camera-outline" size={20} color={colors.accent} />
          <Text style={styles.actionLabel}>Tomar foto</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleAdd('gallery')}
          disabled={disabled}
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="images-outline" size={20} color={colors.accent} />
          <Text style={styles.actionLabel}>Galería</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  strip: {
    marginBottom: spacing.md,
  },
  thumbWrapper: {
    marginRight: spacing.sm,
  },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onAccent,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  actionLabel: {
    ...typography.callout,
    color: colors.accent,
  },
});
