/**
 * Tema de marca TrackBag — único lugar donde viven colores, espaciados y
 * tipografía. Estética minimalista, tema oscuro, acento verde.
 */
export const colors = {
  background: '#0a0a0a',
  surface: '#141414',
  surfaceElevated: '#1c1c1e',
  border: '#2a2a2c',
  accent: '#4ade80',
  accentPressed: '#36b866',
  onAccent: '#052e12',
  gold: '#d4af37',
  text: '#f5f5f7',
  textSecondary: '#a1a1a6',
  textTertiary: '#6e6e73',
  danger: '#f87171',
  dangerSurface: '#2a1414',
  success: '#4ade80',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const typography = {
  largeTitle: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4 },
  headline: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  callout: { fontSize: 15, fontWeight: '500' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.3 },
} as const;
