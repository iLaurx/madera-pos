/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
      },
      colors: {
        cream: '#FFFFFC',
        wood: '#FBBE93',
        carbon: '#333333',
        brand: {
          50: '#fdf5f1',
          100: '#f9e8df',
          200: '#f3d0c0',
          300: '#e8b09a',
          400: '#D48C70',
          500: '#D48C70',
          600: '#D48C70',
          700: '#c07a5f',
          800: '#a6664f',
          900: '#8a5340',
        },
      },
    },
  },
  plugins: [],
}
