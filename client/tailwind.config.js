/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F5FA',
          100: '#E1EBF5',
          200: '#C2D7EC',
          300: '#94BCDF',
          400: '#5F9BCE',
          500: '#357DB9',
          600: '#23639A',
          700: '#1C4F7C',
          800: '#184267',
          900: '#0F273E',
          950: '#091827',
        },
        industrial: {
          steel: '#475569',
          navy: '#0F172A',
          blue: '#1E3A8A',
          accent: '#0284C7',
          border: '#E2E8F0',
          panel: '#F8FAFC',
          muted: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        invoice: ['Arial', 'Helvetica', 'sans-serif']
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'card': '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.03)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 10px 10px -5px rgba(15, 23, 42, 0.08)',
        'invoice': '0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }
    },
  },
  plugins: [],
}
