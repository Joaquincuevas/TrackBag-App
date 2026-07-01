import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { signUpSchema } from '@/features/auth/schemas';
import { friendlyAuthError, zodFieldErrors } from '@/shared/lib/formErrors';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Button } from '@/shared/ui/Button';
import { colors, spacing, typography } from '@/theme';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignUp() {
    setFormError(null);
    const parsed = signUpSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        // El enlace de confirmación vuelve a la app por deep link.
        emailRedirectTo: Linking.createURL('/'),
      },
    });
    setSubmitting(false);

    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }

    // Sin verificación no hay sesión: mostramos la pantalla de "revisa tu email".
    router.push({ pathname: '/(auth)/verify-email', params: { email: parsed.data.email } });
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.brand}>TrackBag</Text>
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>
          Registra tus palos con fotos y números de serie. Si algo desaparece, tendrás la prueba.
        </Text>
      </View>

      <TextField
        label="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
        error={fieldErrors.fullName}
        autoComplete="name"
        placeholder="Juan Pérez"
      />
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
        autoComplete="new-password"
        placeholder="Mínimo 10 caracteres, letras y números"
      />

      {formError !== null && <Text style={styles.formError}>{formError}</Text>}

      <Button title="Crear cuenta" onPress={handleSignUp} loading={submitting} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
        <Link href="/(auth)/sign-in" style={styles.footerLink}>
          Iniciar sesión
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
    lineHeight: 22,
  },
  formError: {
    ...typography.callout,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
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
