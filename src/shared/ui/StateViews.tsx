import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';

/** Estado de carga a pantalla completa. */
export function LoadingView({ message }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      {message != null && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

/** Estado vacío amable, con acción opcional. */
export function EmptyView({
  icon,
  title,
  message,
  actionTitle,
  onAction,
}: {
  icon?: string;
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      {icon != null && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      {message != null && <Text style={styles.message}>{message}</Text>}
      {actionTitle != null && onAction != null && (
        <Button title={actionTitle} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

/** Estado de error con reintento. */
export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Algo salió mal</Text>
      <Text style={styles.message}>{message ?? 'No pudimos cargar tus datos. Revisa tu conexión.'}</Text>
      {onRetry != null && (
        <Button title="Reintentar" variant="secondary" onPress={onRetry} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  icon: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  action: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
