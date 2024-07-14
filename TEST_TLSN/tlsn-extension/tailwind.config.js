/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#243f5f',
        bluelight: '#1C31A5',
        bluemidlight: '#101F78',
        bluemiddark: '#020F59',
        bluedark: '#010937',
        greentheme: '#B0E338',
      },
      animation: {
        'spin-slow': 'spin 6s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
