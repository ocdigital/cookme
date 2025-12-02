/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF8C42',
        secondary: '#fd7e29',
        dark: '#2C1810',
        light: '#FFFBF0',
        border: '#f0e5d8',
        text: '#666',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.10)',
        'large': '0 10px 32px rgba(0, 0, 0, 0.12)',
        'xl-custom': '0 20px 40px rgba(0, 0, 0, 0.15)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.08)',
        'stat-card': '0 15px 40px rgba(255, 140, 66, 0.12)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      spacing: {
        'safe': '0.125rem',
      },
      transitionDuration: {
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
