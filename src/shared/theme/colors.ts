export const darkColors = {
  background: '#0F0F0F',
  surface: '#181818',
  surfaceMuted: '#242424',
  border: '#303030',
  text: '#FFFFFF',
  textMuted: '#AFAFAF',
  textSubtle: '#7A7A7A',
  brand: '#FF0033',
  brandMuted: '#3A1118',
  success: '#2ECC71',
  warning: '#F4B740',
  blue: '#3EA6FF',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const lightColors = {
  background: '#FFFFFF',
  surface: '#F9F9F9',
  surfaceMuted: '#EAEAEA',
  border: '#DEDEDE',
  text: '#0F0F0F',
  textMuted: '#606060',
  textSubtle: '#909090',
  brand: '#FF0033',
  brandMuted: '#FFD6DB',
  success: '#27AE60',
  warning: '#F39C12',
  blue: '#2980B9',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ThemeColors = Record<keyof typeof darkColors, string>;
