import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { signInSchema } from '@/features/auth/schemas';
import { friendlyAuthError, zodFieldErrors } from '@/shared/lib/formErrors';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Button } from '@/shared/ui/Button';
import { colors, spacing, typography } from '@/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    setFormError(null);
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        router.push({ pathname: '/(auth)/verify-email', params: { email: parsed.data.email } });
        return;
      }
      setFormError(friendlyAuthError(error.message));
    }
    // Con sesión activa, el guard del layout raíz redirige solo.
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.brand}>TrackBag</Text>
        <Text style={styles.title}>Bienvenido de vuelta</Text>
        <Text style={styles.subtitle}>Tu bolsa, protegida y documentada.</Text>
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
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        secureTextEntry
        autoComplete="current-password"
        placeholder="••••••••••"
      />

      {formError !== null && <Text style={styles.formError}>{formError}</Text>}

      <Button title="Iniciar sesión" onPress={handleSignIn} loading={submitting} />

      <Link href="/(auth)/forgot-password" style={styles.link}>
        ¿Olvidaste tu contraseña?
      </Link>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tienes cuenta?</Text>
        <Link href="/(auth)/sign-up" style={styles.footerLink}>
          Crear cuenta
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  brand: {
    ...typography.label,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.largeTitle,
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
  link: {
    ...typography.callout,
    color: colors.accent,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.callout,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.callout,
    color: colors.accent,
    fontWeight: '600',
  },
});
