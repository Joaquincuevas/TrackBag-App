import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { friendlyAuthError } from '@/shared/lib/formErrors';
import { Screen } from '@/shared/ui/Screen';
import { Button } from '@/shared/ui/Button';
import { colors, spacing, typography } from '@/theme';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleResend() {
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setSending(false);
    setStatus(error ? friendlyAuthError(error.message) : 'Email reenviado. Revisa tu bandeja.');
  }

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.icon}>✉️</Text>
        <Text style={styles.title}>Verifica tu email</Text>
        <Text style={styles.message}>
          Te enviamos un enlace de verificación a{'\n'}
          <Text style={styles.email}>{email ?? 'tu email'}</Text>
        </Text>
        <Text style={styles.hint}>
          Abre el enlace desde este teléfono para activar tu cuenta. Hasta entonces no podrás
          acceder a tus datos.
        </Text>

        {status !== null && <Text style={styles.status}>{status}</Text>}

        <Button
          title="Reenviar email"
          variant="secondary"
          onPress={handleResend}
          loading={sending}
          style={styles.button}
        />
        <Button
          title="Volver a iniciar sesión"
          variant="ghost"
          onPress={() => router.replace('/(auth)/sign-in')}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    color: colors.accent,
    fontWeight: '600',
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  status: {
    ...typography.callout,
    color: colors.accent,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
