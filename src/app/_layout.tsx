import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase';
import { SessionProvider, useSession } from '@/features/auth/SessionProvider';
import { LoadingView } from '@/shared/ui/StateViews';
import { colors } from '@/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

/**
 * Los enlaces de email de Supabase (confirmación de cuenta, recuperación de
 * contraseña) vuelven a la app por deep link con tokens en el fragmento.
 * Aquí se convierten en sesión de forma segura.
 */
async function handleAuthDeepLink(url: string): Promise<void> {
  const fragment = url.split('#')[1];
  if (!fragment) return;

  const params = new URLSearchParams(fragment);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) return;

  if (params.get('type') === 'recovery') {
    router.replace('/reset-password');
  }
}

function useAuthDeepLinks() {
  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (url) void handleAuthDeepLink(url);
  }, [url]);
}

function RootNavigator() {
  const { session, isLoading } = useSession();
  useAuthDeepLinks();

  // Restaurando la sesión persistida — no decidimos ruta todavía.
  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Protected guard={session !== null}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={session === null}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </SessionProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
