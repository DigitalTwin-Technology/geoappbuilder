/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MapForge color palette
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dfff',
          300: '#7cc5fd',
          400: '#36a7fa',
          500: '#0c8ceb',
          600: '#006fc9',
          700: '#0158a3',
          800: '#064b86',
          900: '#0b3f6f',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
        },
        border: {
          DEFAULT: '#e2e8f0',
          strong: '#cbd5e1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

