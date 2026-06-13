// Design tokens para o CookMe
// Cores em oklch; fallbacks hex onde útil para compat

const T = {
  // --- Cores de marca ---
  // Verde primária (fresh, trustworthy)
  green: {
    50:  'oklch(0.97 0.02 145)',
    100: 'oklch(0.94 0.04 145)',
    200: 'oklch(0.88 0.08 145)',
    400: 'oklch(0.72 0.13 145)',
    500: 'oklch(0.62 0.14 145)',   // PRIMARY
    600: 'oklch(0.54 0.13 145)',
    700: 'oklch(0.44 0.11 145)',
    900: 'oklch(0.28 0.06 145)',
  },
  // Âmbar quente (culinária)
  amber: {
    50:  'oklch(0.97 0.03 75)',
    100: 'oklch(0.94 0.06 75)',
    400: 'oklch(0.80 0.14 70)',
    500: 'oklch(0.74 0.16 70)',
    600: 'oklch(0.66 0.16 65)',
    700: 'oklch(0.56 0.14 60)',
  },
  // Alerta / destrutivo
  red: {
    50:  'oklch(0.96 0.02 25)',
    500: 'oklch(0.62 0.18 25)',
    600: 'oklch(0.54 0.17 25)',
  },
  // Neutros quentes
  ink: {
    0:   'oklch(1.00 0 0)',
    50:  'oklch(0.985 0.003 90)',  // bg principal off-white
    100: 'oklch(0.965 0.004 85)',  // cards secundários
    150: 'oklch(0.935 0.005 85)',
    200: 'oklch(0.905 0.006 85)',  // divisores
    300: 'oklch(0.82 0.008 85)',
    400: 'oklch(0.68 0.010 85)',   // texto secundário
    500: 'oklch(0.54 0.012 85)',
    600: 'oklch(0.42 0.012 85)',   // texto médio
    700: 'oklch(0.32 0.012 85)',   // texto primário
    800: 'oklch(0.22 0.010 85)',
    900: 'oklch(0.14 0.008 85)',   // títulos fortes
  },
};

const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

const shadow = {
  sm:  '0 1px 2px rgba(58,42,20,.06), 0 1px 1px rgba(58,42,20,.04)',
  md:  '0 4px 12px rgba(58,42,20,.07), 0 2px 4px rgba(58,42,20,.05)',
  lg:  '0 12px 32px rgba(58,42,20,.10), 0 4px 12px rgba(58,42,20,.05)',
  ring: 'inset 0 0 0 1px rgba(58,42,20,.06)',
};

const font = {
  sans: '"Plus Jakarta Sans", -apple-system, "Segoe UI", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

// Type scale — 1.2 ratio
const type = {
  display:   { fontSize: 32, lineHeight: '38px', fontWeight: 700, letterSpacing: -0.6 },
  h1:        { fontSize: 26, lineHeight: '32px', fontWeight: 700, letterSpacing: -0.4 },
  h2:        { fontSize: 20, lineHeight: '26px', fontWeight: 700, letterSpacing: -0.2 },
  h3:        { fontSize: 17, lineHeight: '22px', fontWeight: 600, letterSpacing: -0.1 },
  body:      { fontSize: 15, lineHeight: '21px', fontWeight: 500 },
  bodyLoose: { fontSize: 15, lineHeight: '22px', fontWeight: 400 },
  small:     { fontSize: 13, lineHeight: '18px', fontWeight: 500 },
  micro:     { fontSize: 11, lineHeight: '14px', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' },
  mono:      { fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 13, fontWeight: 500 },
};

Object.assign(window, { T, radius, shadow, font, type });
