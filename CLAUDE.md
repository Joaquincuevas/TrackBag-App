# TrackBag App

App Expo (SDK 57) + TypeScript + Supabase. Ver README.md para el setup completo.

## Comandos

- `npx expo start` — dev server (requiere `.env` con credenciales de Supabase)
- `npx tsc --noEmit` — typecheck
- `npm run lint` — ESLint
- `supabase db push` — aplicar migraciones de `supabase/migrations/`

## Reglas del proyecto

- TypeScript estricto; alias `@/` → `src/`.
- Colores/espaciados SOLO desde `src/theme` — nada hardcodeado en pantallas.
- Toda tabla nueva lleva `user_id` + políticas RLS `auth.uid() = user_id` para las 4 operaciones. El bucket de fotos es privado; rutas `{user_id}/...`.
- Validación en dos capas: Zod en `features/*/schemas.ts` + constraints en la migración.
- Las imágenes SIEMPRE pasan por `features/photos/imagePicker.ts` antes de subirse (elimina EXIF/geolocalización).
- La `service_role` key jamás se usa en este repo. Solo `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` vía `.env`.
