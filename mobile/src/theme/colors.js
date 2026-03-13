// Food Delivery Mobile - Design System Colors
// Based on Tailwind Theme Guide

export const colors = {
  // Primary
  primary: '#FF7A00',        // Main orange
  primaryLight: '#FFA94D',   // Light orange
  primarySoft: '#FFF4EB',    // Soft orange background

  // Secondary Colors
  secondary: {
    purple: '#7C4DFF',
    blue: '#2F80ED',
    green: '#27AE60',
    pink: '#FF5A7D',
  },

  // Background
  background: {
    main: '#F8F9FB',
    card: '#FFFFFF',
    soft: '#F1F3F5',
  },

  // Text
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    muted: '#9CA3AF',
  },

  // Borders
  border: {
    light: '#E5E7EB',
  },

  // Neutrals (for convenience)
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Tab Bar specific
  tabBar: {
    background: '#FFFFFF',
    border: '#E5E7EB',
    iconInactive: '#9CA3AF',
    iconActive: '#FF7A00',
    fab: '#FF7A00',
  },
};

// Typography Scale
export const typography = {
  headingXL: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  headingLG: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  headingMD: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.text.secondary,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.text.secondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.text.muted,
  },
};

// Spacing System
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Border Radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};
