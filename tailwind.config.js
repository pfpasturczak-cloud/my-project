/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#0a0a0a',
        'off-white': '#f0ede8',
        'warm-grey': '#a09890',
        accent: '#c9a96e',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
