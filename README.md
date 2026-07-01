# TrackBag — App móvil

App móvil (iOS y Android) del tier premium de **TrackBag**: cada jugador registra los palos de su bolsa con fotos y datos (incluido el número de serie). El objetivo es doble: tener un inventario ordenado y **disuadir y documentar el robo** — un registro fotografiado con número de serie sirve como prueba ante el club, el seguro o la policía.

## Stack

- **App:** React Native + [Expo SDK 57](https://expo.dev) + TypeScript estricto, navegación con Expo Router.
- **Backend:** [Supabase](https://supabase.com) — Auth con verificación de email, PostgreSQL con Row Level Security, Storage privado para fotos.
- **Datos:** TanStack Query (React Query). **Validación:** Zod (cliente) + constraints SQL (base).
- **Sesión:** tokens cifrados con clave en Keychain/Keystore (`expo-secure-store`).

## Estructura

```
supabase/migrations/     Migraciones SQL: esquema, RLS y políticas de Storage
src/
  app/                   Pantallas (Expo Router)
    (auth)/              Login, registro, verificación, recuperación
    (app)/               Zona autenticada: onboarding, tabs, palos
  features/              auth, bags, clubs, photos, profile, report
  shared/                UI reutilizable (Button, TextField, estados…)
  lib/                   Cliente Supabase, tipos de la base, secure store
  theme/                 Colores/espaciado/tipografía de marca (un solo lugar)
```

## Requisitos previos

- Node.js 20+ y npm.
- App **Expo Go** en tu teléfono (o un simulador iOS / emulador Android).
- Una cuenta gratuita en [supabase.com](https://supabase.com).
- (Para las migraciones) [Supabase CLI](https://supabase.com/docs/guides/cli): `brew install supabase/tap/supabase`.

## 1. Crear el proyecto en Supabase

1. En el [dashboard de Supabase](https://supabase.com/dashboard), crea un proyecto nuevo (elige una contraseña de base de datos fuerte y guárdala).
2. En **Authentication → Sign In / Up → Email**, verifica que **"Confirm email" esté activado** (es el valor por defecto). Sin esto no hay verificación obligatoria.
3. En **Authentication → URL Configuration**, añade a *Redirect URLs*:
   - `trackbagapp://**`
   - `exp://**` (solo para desarrollo con Expo Go)
4. (Recomendado) En **Authentication → Rate Limits**, revisa los límites de emails y de intentos de login. Los valores por defecto ya frenan fuerza bruta; puedes endurecerlos.

## 2. Correr las migraciones

Con el CLI de Supabase, desde la raíz del proyecto:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF   # el ref aparece en la URL del dashboard
supabase db push
```

Esto crea las tablas (`profiles`, `bags`, `clubs`, `club_photos`), los enums, los triggers, **todas las políticas RLS**, el bucket privado `club-photos` y sus políticas de Storage.

> Alternativa sin CLI: copia el contenido de `supabase/migrations/*.sql` (en orden) en el **SQL Editor** del dashboard y ejecútalo.

## 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Completa `.env` con los valores de **Project Settings → API** de tu proyecto:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

⚠️ Solo la **anon key**. La `service_role` key jamás va en la app: toda la seguridad descansa en RLS, no en ocultar claves.

## 4. Levantar la app

```bash
npm install
npx expo start
```

Escanea el QR con Expo Go (Android) o con la cámara (iOS), o pulsa `i` / `a` para abrir simulador/emulador.

> Nota: en Expo Go la cámara y el compartir PDF funcionan; para un build nativo propio usa `npx expo run:ios` / `npx expo run:android` o EAS Build.

## Funcionalidades

- Registro con email + contraseña y **verificación de email obligatoria** (sin verificar no hay sesión ni acceso a datos).
- Login, recuperación de contraseña (deep link de vuelta a la app), sesión persistente con refresh automático y logout que limpia tokens.
- Onboarding: nombre + primera bolsa.
- **Mi Bolsa**: grid de palos con foto principal, contador (con referencia al máximo de 14 en competición) y acceso rápido a "Agregar palo".
- Alta/edición de palos con **cámara o galería** (varias fotos por palo), formulario validado con Zod.
- Detalle del palo: carrusel de fotos, número de serie destacado, editar y eliminar con confirmación.
- Perfil editable y cierre de sesión.
- **Exportar reporte PDF** de la bolsa con fotos, datos y números de serie — pensado para el seguro o una denuncia.
- Estados de carga, vacío y error en todas las pantallas.

## Decisiones de seguridad

El modelo de amenaza: la app guarda una lista de palos caros con números de serie y fotos. Filtrada, sería una lista de objetivos para ladrones. Por eso:

1. **RLS en todas las tablas.** Cada política (SELECT/INSERT/UPDATE/DELETE) exige `auth.uid() = user_id`. No existe ninguna política para el rol anónimo: sin sesión verificada no se lee ni una fila. Un usuario no puede ver ni tocar datos de otro, aunque el cliente esté comprometido.
2. **Defensa en profundidad en la base:** además de RLS, triggers verifican que un palo solo pueda colgar de una bolsa del mismo usuario y una foto solo de un palo del mismo usuario; enums, checks de rango/longitud y foreign keys con `on delete cascade` garantizan integridad.
3. **Storage privado.** El bucket `club-photos` no es público; cada archivo vive en `{user_id}/…` y las políticas de Storage solo permiten operar dentro de la carpeta propia. Las fotos se muestran con **URLs firmadas temporales** (1 h en la app, 15 min para el PDF).
4. **Solo la anon key en el cliente.** La `service_role` key no existe en este repositorio ni en la app. La anon key es pública por diseño: RLS es la barrera real.
5. **Verificación de email obligatoria.** Supabase no emite sesión hasta confirmar el email, y el guard de navegación no muestra ninguna pantalla de datos sin sesión.
6. **Tokens cifrados.** La sesión supera el límite de SecureStore, así que se usa el patrón recomendado por Supabase: el valor se cifra con AES-256-CTR y la clave vive en el Keychain (iOS) / Keystore (Android). Nada legible queda en almacenamiento plano. El logout borra blob y clave.
7. **Validación en dos capas.** Zod valida cada formulario en el cliente (mensajes claros) y los constraints SQL repiten las mismas reglas en el servidor — el cliente nunca es la única barrera.
8. **Privacidad de las fotos.** Antes de subir, cada imagen se re-encodea a JPEG con tamaño acotado: esto **elimina todos los metadatos EXIF, incluida la geolocalización** (no filtramos dónde vive o juega el usuario), limita el tamaño (≤ 5 MB, también forzado en el bucket) y fija el tipo de archivo.
9. **Secretos fuera del código.** Credenciales solo por `.env` (gitignored), con `.env.example` como plantilla. El cliente rechaza URLs que no sean HTTPS; Supabase solo sirve por TLS.
10. **Rate limiting** de auth gestionado por Supabase (login, registro, reenvío de emails) para frenar fuerza bruta.
11. **Mínimo privilegio.** Las políticas conceden exactamente las operaciones que la app necesita y nada más (p. ej. `profiles` no permite INSERT ni DELETE desde el cliente: la fila la crea un trigger y muere con el usuario). El cierre de sesión limpia además la caché de React Query para que no queden datos del usuario anterior en memoria.

## Extensiones previstas

- `bags.rfid_tag_id` (nullable, único) queda reservado para vincular la bolsa con un chip RFID del sistema TrackBag de salas de guardado.
- El esquema ya soporta varias bolsas por usuario; la UI actual trabaja con una.
