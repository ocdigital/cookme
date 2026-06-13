// CookMe Design System
// Tokens traduzidos do design (cookme desing/src/tokens.jsx) para React Native

export const colors = {
  green: {
    50:  '#F2FAF3',
    100: '#DFF2E3',
    200: '#BBE4C4',
    400: '#5CB870',
    500: '#3D9E52',  // PRIMARY
    600: '#2E7D3F',
    700: '#235F30',
    900: '#0F3018',
  },
  amber: {
    50:  '#FFF8ED',
    100: '#FEEFD4',
    200: '#FDDBA8',
    400: '#F5A623',
    500: '#E8920D',
    600: '#C97A08',
    700: '#A36205',
    800: '#7A4903',
    900: '#532F01',
  },
  red: {
    50:  '#FFF2F0',
    100: '#FFE4E0',
    200: '#FFCAC4',
    500: '#E03A2E',
    600: '#C42F24',
  },
  ink: {
    0:   '#FFFFFF',
    50:  '#FAFAF8',   // bg principal off-white
    100: '#F5F4F1',
    150: '#EDEBE6',
    200: '#E2DFD8',
    300: '#C8C3B8',
    400: '#9E9890',
    500: '#7A7469',
    600: '#5C564D',
    700: '#403B34',
    800: '#2C2720',
    900: '#1A1610',
  },
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.6 },
  h1:      { fontSize: 26, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.4 },
  h2:      { fontSize: 20, lineHeight: 26, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3:      { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.1 },
  body:    { fontSize: 15, lineHeight: 21, fontWeight: '500' as const },
  small:   { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  micro:   { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 0.4 },
  mono:    { fontSize: 12, fontWeight: '500' as const },
};

// Compatibilidade com código legado que importava Colors
export const Colors = {
  light: { text: '#1A1610', background: '#FAFAF8', tint: '#3D9E52', icon: '#9E9890', tabIconDefault: '#9E9890', tabIconSelected: '#3D9E52' },
  dark:  { text: '#FAFAF8', background: '#1A1610', tint: '#5CB870', icon: '#7A7469', tabIconDefault: '#7A7469', tabIconSelected: '#5CB870' },
};

export const shadows = {
  sm: {
    shadowColor: '#3A2A14',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#3A2A14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#3A2A14',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 6,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
};
