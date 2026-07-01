import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  optional?: boolean;
};

export function TextField({ label, error, optional = false, style, ...inputProps }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {optional && <Text style={styles.optional}>  · opcional</Text>}
      </Text>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, error != null && styles.inputError, style]}
        {...inputProps}
      />
      {error != null && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  optional: {
    color: colors.textTertiary,
    textTransform: 'none',
    fontWeight: '400',
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
