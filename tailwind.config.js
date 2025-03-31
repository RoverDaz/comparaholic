/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {
        colors: {
          'theme': {
            50: '#f0f7f7',
            100: '#dce8e8',
            200: '#b9d1d0',
            300: '#8fb3b2',
            400: '#619594',
            500: '#316563',
            600: '#2c5b59',
            700: '#254d4b',
            800: '#1d3e3d',
            900: '#162f2e',
            950: '#0d1c1c',
          },
        },
      },
    },
    plugins: [],
  };