import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Ingresa un email válido');

/**
 * Requisitos de contraseña razonables: longitud como factor principal
 * (guía OWASP/NIST), más un mínimo de variedad para evitar contraseñas
 * triviales tipo "aaaaaaaaaa".
 */
export const passwordSchema = z
  .string()
  .min(10, 'Mínimo 10 caracteres')
  .max(128, 'Máximo 128 caracteres')
  .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), {
    message: 'Debe incluir al menos una letra y un número',
  });

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Ingresa tu nombre').max(120),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
