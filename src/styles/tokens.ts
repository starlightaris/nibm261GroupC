export const Colors = {
  primary: '#1D4ED8',
  primaryLight: '#EFF6FF',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  muted: '#94A3B8',
  border: '#F1F5F9',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  success: '#22C55E',
  successLight: '#DCFCE7',
  successText: '#15803D',
  warning: '#F59E0B',
  warningLight: '#FEF9C3',
  warningText: '#854D0E',
  purple: '#5B21B6',
  purpleLight: '#EDE9FE',
  absent: '#F1F5F9',
  absentText: '#94A3B8',
} as const;

export const Radius = {
  card: 16,
  button: 14,
  md: 10,
  pill: 20,
  avatar: 22,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const Typography = {
  labelCaps: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 20,
  },
  body: {
    fontSize: 15,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
} as const;
