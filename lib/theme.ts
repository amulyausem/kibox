import { useColorScheme } from '@/components/useColorScheme';

export const light = {
  ink: '#0f1416',
  muted: '#667079',
  line: '#e6eaee',
  paper: '#ffffff',
  bg0: '#f7f8f9',
  mint: '#5B8A81',
  sage: '#8fa9a0',
  clay: '#c7b7a2',
  mintSoft: 'rgba(91, 138, 129, 0.14)',
  claySoft: 'rgba(199, 183, 162, 0.28)',
  rust: '#9A5344',
  rustSoft: 'rgba(154, 83, 68, 0.12)',
  nav: '#596169',
  shadow: 'rgba(15, 20, 22, 0.08)',
};

export const dark: typeof light = {
  ink: '#f4f6f7',
  muted: '#9aa3aa',
  line: '#2a3238',
  paper: '#1c2226',
  bg0: '#121618',
  mint: '#7aa59c',
  sage: '#8fa9a0',
  clay: '#c7b7a2',
  mintSoft: 'rgba(122, 165, 156, 0.18)',
  claySoft: 'rgba(199, 183, 162, 0.18)',
  rust: '#D9897A',
  rustSoft: 'rgba(217, 137, 122, 0.16)',
  nav: '#9aa3aa',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export type Theme = typeof light;

export const fonts = {
  sans: 'Inter_400Regular',
  sansMd: 'Inter_600SemiBold',
  sansBd: 'Inter_700Bold',
  serif: 'Newsreader_600SemiBold',
  serifBd: 'Newsreader_700Bold',
} as const;

export const radii = {
  md: 14,
  lg: 24,
  pill: 999,
} as const;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
