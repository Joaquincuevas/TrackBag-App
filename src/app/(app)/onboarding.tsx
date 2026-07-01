import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { useCreateBag } from '@/features/bags/hooks';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks';
import { useSession } from '@/features/auth/SessionProvider';
import { zodFieldErrors } from '@/shared/lib/formErrors';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Button } from '@/shared/ui/Button';
import { ErrorView, LoadingView } from '@/shared/ui/StateViews';
import { colors, spacing, typography } from '@/theme';

const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, 'Ingresa tu nombre').max(120),
  bagName: z.string().trim().min(1, 'Dale un nombre a tu bolsa').max(80),
});

export default function OnboardingScreen() {
  const profileQuery = useProfile();

  if (profileQuery.isLoading) {
    return <LoadingView />;
  }
  if (profileQuery.isError) {
    return <ErrorView onRetry={() => void profileQuery.refetch()} />;
  }

  // Prellenado con el nombre dado en el registro.
  return <OnboardingForm initialName={profileQuery.data?.full_name ?? ''} />;
}

function OnboardingForm({ initialName }: { initialName: string }) {
  const { signOut } = useSession();
  const updateProfile = useUpdateProfile();
  const createBag = useCreateBag();

  const [fullName, setFullName] = useState(initialName);
  const [bagName, setBagName] = useState('Bolsa principal');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const submitting = updateProfile.isPending || createBag.isPending;

  async function handleFinish() {
    setFormError(null);
    const parsed = onboardingSchema.safeParse({ fullName, bagName });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    try {
      await updateProfile.mutateAsync({ full_name: parsed.data.fullName });
      await createBag.mutateAsync(parsed.data.bagName);
      // Al invalidarse la query de la bolsa, el layout nos deja pasar a (tabs).
    } catch {
      setFormError('No pudimos guardar tus datos. Inténtalo de nuevo.');
    }
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.brand}>TrackBag</Text>
        <Text style={styles.title}>Casi listo</Text>
        <Text style={styles.subtitle}>
          Confirma tu nombre y crea tu primera bolsa. Después podrás registrar tus palos uno a uno.
        </Text>
      </View>

      <TextField
        label="Tu nombre"
        value={fullName}
        onChangeText={setFullName}
        error={fieldErrors.fullName}
        autoComplete="name"
        placeholder="Juan Pérez"
      />
      <TextField
        label="Nombre de tu bolsa"
        value={bagName}
        onChangeText={setBagName}
        error={fieldErrors.bagName}
        placeholder="Bolsa principal"
      />

      {formError !== null && <Text style={styles.formError}>{formError}</Text>}

      <Button title="Crear mi bolsa" onPress={handleFinish} loading={submitting} />
      <Button
        title="Cerrar sesión"
        variant="ghost"
        onPress={() => void signOut()}
        style={styles.signOut}
      />
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
  signOut: {
    marginTop: spacing.md,
  },
});
