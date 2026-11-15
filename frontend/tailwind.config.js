/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        nutri: { green: '#247A59', dark: '#174936', mint: '#F1F8F3', warm: '#FAFBF8' },
      },
    },
  },
  plugins: [],
}
