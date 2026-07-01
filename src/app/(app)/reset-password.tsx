import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { resetPasswordSchema } from '@/features/auth/schemas';
import { friendlyAuthError, zodFieldErrors } from '@/shared/lib/formErrors';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Button } from '@/shared/ui/Button';
import { colors, spacing, typography } from '@/theme';

/** Destino del deep link de recuperación: define la nueva contraseña. */
export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setFormError(null);
    const parsed = resetPasswordSchema.safeParse({ password });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSubmitting(false);

    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    router.replace('/(app)/(tabs)');
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Nueva contraseña</Text>
        <Text style={styles.subtitle}>Define una contraseña nueva para tu cuenta.</Text>
      </View>

      <TextField
        label="Nueva contraseña"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        secureTextEntry
        autoComplete="new-password"
        placeholder="Mínimo 10 caracteres, letras y números"
      />

      {formError !== null && <Text style={styles.formError}>{formError}</Text>}

      <Button title="Guardar contraseña" onPress={handleSave} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  formError: {
    ...typography.callout,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
