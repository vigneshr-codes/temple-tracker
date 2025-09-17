/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{vue,html}",
  ],
  theme: {
    extend: {
      colors: {
        temple: {
          50: '#fdf4f3',
          100: '#fce8e6',
          200: '#f9d5d3',
          300: '#f4b4b0',
          400: '#ed8884',
          500: '#e1615a',
          600: '#cd4b42',
          700: '#ab3d36',
          800: '#8e3530',
          900: '#78332f',
        },
        saffron: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      fontFamily: {
        'hindi': ['Noto Sans Devanagari', 'sans-serif'],
        'tamil': ['Noto Sans Tamil', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}