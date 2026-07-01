import { Stack } from 'expo-router';
import { useBag } from '@/features/bags/hooks';
import { ErrorView, LoadingView } from '@/shared/ui/StateViews';
import { colors } from '@/theme';

/**
 * Zona autenticada. Si el usuario aún no tiene bolsa (primer login),
 * solo puede ver el onboarding.
 */
export default function AppLayout() {
  const { data: bag, isLoading, isError, refetch } = useBag();

  if (isLoading) {
    return <LoadingView message="Cargando tu bolsa…" />;
  }
  if (isError) {
    return <ErrorView onRetry={() => void refetch()} />;
  }

  const hasBag = bag != null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={hasBag}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="club/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="club/[id]/index" />
        <Stack.Screen name="club/[id]/edit" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!hasBag}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      {/* Accesible siempre: destino del deep link de recuperación. */}
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
