import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { forgotPasswordSchema } from '@/features/auth/schemas';
import { friendlyAuthError, zodFieldErrors } from '@/shared/lib/formErrors';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Button } from '@/shared/ui/Button';
import { colors, spacing, typography } from '@/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setFormError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: Linking.createURL('/reset-password'),
    });
    setSubmitting(false);

    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.icon}>📬</Text>
          <Text style={styles.title}>Revisa tu email</Text>
          <Text style={styles.subtitle}>
            Si existe una cuenta con {email.trim().toLowerCase()}, recibirás un enlace para
            restablecer tu contraseña. Ábrelo desde este teléfono.
          </Text>
          <Button
            title="Volver a iniciar sesión"
            variant="secondary"
            onPress={() => router.replace('/(auth)/sign-in')}
            style={styles.button}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa tu email y te enviaremos un enlace para crear una contraseña nueva.
        </Text>
      </View>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="tu@email.com"
      />

      {formError !== null && <Text style={styles.formError}>{formError}</Text>}

      <Button title="Enviar enlace" onPress={handleSend} loading={submitting} />
      <Button
        title="Cancelar"
        variant="ghost"
        onPress={() => router.back()}
        style={styles.button}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  formError: {
    ...typography.callout,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
