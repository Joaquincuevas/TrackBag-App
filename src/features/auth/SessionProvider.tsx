import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type SessionContextValue = {
  session: Session | null;
  /** true mientras se restaura la sesión persistida al arrancar. */
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut(); // limpia tokens del almacenamiento seguro
    queryClient.clear(); // nada del usuario anterior queda en caché
  }, [queryClient]);

  const value = useMemo(
    () => ({ session, isLoading, signOut }),
    [session, isLoading, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession debe usarse dentro de SessionProvider');
  }
  return context;
}

/** Para pantallas que solo se renderizan con sesión activa. */
export function useUserId(): string {
  const { session } = useSession();
  if (!session) {
    throw new Error('useUserId requiere una sesión activa');
  }
  return session.user.id;
}
