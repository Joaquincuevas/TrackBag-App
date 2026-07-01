import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

type Props = PropsWithChildren<{
  /** Usa scroll para formularios y contenido largo. */
  scroll?: boolean;
  /** Padding inferior extra (ej. para botones flotantes). */
  paddedBottom?: boolean;
}>;

export function Screen({ children, scroll = false, paddedBottom = false }: Props) {
  const insets = useSafeAreaInsets();
  const paddingBottom = (paddedBottom ? 96 : spacing.lg) + insets.bottom;

  if (scroll) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.root}
          contentContainerStyle={[styles.content, { paddingBottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return <View style={[styles.root, styles.content, { paddingBottom }]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
});
