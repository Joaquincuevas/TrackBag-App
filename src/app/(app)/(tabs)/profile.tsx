import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { useSession } from '@/features/auth/SessionProvider';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks';
import { zodFieldErrors } from '@/shared/lib/formErrors';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { Button } from '@/shared/ui/Button';
import { ErrorView, LoadingView } from '@/shared/ui/StateViews';
import { colors, spacing, typography } from '@/theme';
import type { Profile } from '@/lib/database.types';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Ingresa tu nombre').max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .transform((value) => (value === '' ? null : value)),
  handicap: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : Number(value.replace(',', '.'))))
    .refine((value) => value === null || (!Number.isNaN(value) && value >= -10 && value <= 54), {
      message: 'Handicap inválido (-10 a 54)',
    }),
});

export default function ProfileScreen() {
  const profileQuery = useProfile();

  if (profileQuery.isLoading || !profileQuery.data) {
    return profileQuery.isError ? (
      <ErrorView onRetry={() => void profileQuery.refetch()} />
    ) : (
      <LoadingView />
    );
  }

  return <ProfileForm profile={profileQuery.data} />;
}

function ProfileForm({ profile }: { profile: Profile }) {
  const { session, signOut } = useSession();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [handicap, setHandicap] = useState(
    profile.handicap !== null ? String(profile.handicap) : '',
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaved(false);
    const parsed = profileSchema.safeParse({ fullName, phone, handicap });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    try {
      await updateProfile.mutateAsync({
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        handicap: parsed.data.handicap,
      });
      setSaved(true);
    } catch {
      Alert.alert('Error', 'No pudimos guardar tu perfil. Inténtalo de nuevo.');
    }
  }

  function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.email}>{session?.user.email}</Text>
      </View>

      <TextField
        label="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
        error={fieldErrors.fullName}
        autoComplete="name"
      />
      <TextField
        label="Teléfono"
        optional
        value={phone}
        onChangeText={setPhone}
        error={fieldErrors.phone}
        keyboardType="phone-pad"
        placeholder="+34 600 000 000"
      />
      <TextField
        label="Handicap"
        optional
        value={handicap}
        onChangeText={setHandicap}
        error={fieldErrors.handicap}
        keyboardType="numbers-and-punctuation"
        placeholder="18.5"
      />

      {saved && <Text style={styles.saved}>Perfil guardado ✓</Text>}

      <Button title="Guardar cambios" onPress={handleSave} loading={updateProfile.isPending} />
      <Button title="Cerrar sesión" variant="danger" onPress={handleSignOut} style={styles.signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
  },
  email: {
    ...typography.callout,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  saved: {
    ...typography.callout,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  signOut: {
    marginTop: spacing.md,
  },
});
