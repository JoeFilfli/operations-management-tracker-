/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b9cdff',
          500: '#3b6ef0',
          600: '#2d5cd4',
          700: '#2449aa',
        },
      },
    },
  },
  plugins: [],
}
