/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F172A',     // Slate 900
          card: '#1E293B',   // Slate 800
          border: '#334155', // Slate 700
          lighter: '#475569' // Slate 600
        },
        primary: {
          DEFAULT: '#0EA5E9', // Sky 500
          hover: '#0284C7',   // Sky 600
          light: '#38BDF8',   // Sky 400
        },
        accent: {
          cyan: '#22D3EE',
          emerald: '#34D399',
          rose: '#F87171',
          amber: '#FBBF24',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
