/**
 * Acceso tipado a variables de entorno. Solo la URL del proyecto y la anon
 * key viven en el cliente — la seguridad real la aporta RLS en el servidor.
 * La service_role key JAMÁS debe estar en la app.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copia .env.example a .env y completa tus credenciales de Supabase.',
  );
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL debe usar HTTPS.');
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
} as const;
