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
        /* Tokens del tema claro (el tema oscuro usa valores explícitos con dark:) */
        cream: '#D0A890',
        wood: '#FBBE93',
        carbon: '#261A12',
        brand: {
          50: '#FCF5F1',
          100: '#EDE4DA',
          200: '#E2D5C7',
          300: '#D99B73',
          400: '#C97045',
          500: '#B3542D',
          600: '#A54A26',
          700: '#9C431F',
          800: '#7E3617',
          900: '#5E2810',
        },
      },
    },
  },
  plugins: [],
}
