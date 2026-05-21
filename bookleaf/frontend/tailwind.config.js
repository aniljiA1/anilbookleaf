/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f4dab1',
          300: '#edc07f',
          400: '#e4a04d',
          500: '#dc852a',
          600: '#ce6d1f',
          700: '#ab551b',
          800: '#89441d',
          900: '#70391b',
        }
      }
    }
  },
  plugins: []
}
