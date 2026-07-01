import { z } from 'zod';

export const CLUB_CATEGORIES = [
  { value: 'driver', label: 'Driver' },
  { value: 'madera', label: 'Madera' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'hierro', label: 'Hierro' },
  { value: 'wedge', label: 'Wedge' },
  { value: 'putter', label: 'Putter' },
] as const;

export const CLUB_CONDITIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'bueno', label: 'Bueno' },
  { value: 'usado', label: 'Usado' },
] as const;

export function categoryLabel(value: string): string {
  return CLUB_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function conditionLabel(value: string): string {
  return CLUB_CONDITIONS.find((c) => c.value === value)?.label ?? value;
}

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === '' ? null : value))
    .nullable();

/** Mismas reglas que los constraints de la base — validación en dos capas. */
export const clubFormSchema = z.object({
  category: z.enum(['driver', 'madera', 'hibrido', 'hierro', 'wedge', 'putter'], {
    message: 'Elige una categoría',
  }),
  brand: z.string().trim().min(1, 'Ingresa la marca').max(80),
  model: z.string().trim().min(1, 'Ingresa el modelo').max(120),
  loft: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : Number(value.replace(',', '.'))))
    .refine((value) => value === null || (!Number.isNaN(value) && value >= 0 && value <= 80), {
      message: 'Loft inválido (0–80°)',
    }),
  shaftFlex: optionalTrimmed(40),
  shaftMaterial: optionalTrimmed(40),
  serialNumber: optionalTrimmed(120),
  condition: z.enum(['nuevo', 'bueno', 'usado']),
  purchaseDate: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: 'Usa el formato AAAA-MM-DD',
    })
    .refine((value) => value === null || !Number.isNaN(new Date(value).getTime()), {
      message: 'Fecha inválida',
    }),
  estimatedValue: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : Number(value.replace(',', '.'))))
    .refine((value) => value === null || (!Number.isNaN(value) && value >= 0), {
      message: 'Valor inválido',
    }),
  notes: optionalTrimmed(2000),
});

export type ClubFormInput = z.input<typeof clubFormSchema>;
export type ClubFormOutput = z.output<typeof clubFormSchema>;
