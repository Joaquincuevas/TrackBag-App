import type { z } from 'zod';

/** Convierte un error de Zod en un mapa campo → primer mensaje. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

/** Mensajes de error de Supabase traducidos a algo amable para el usuario. */
export function friendlyAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Tu email aún no está verificado. Revisa tu bandeja de entrada.';
  }
  if (normalized.includes('user already registered')) {
    return 'Ya existe una cuenta con ese email.';
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) {
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  }
  if (normalized.includes('network')) {
    return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  }
  return message;
}
