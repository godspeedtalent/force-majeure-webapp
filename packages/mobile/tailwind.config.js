/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    '../shared/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'fm-gold': '#dfba7d',
        'fm-crimson': '#520C10',
        'fm-navy': '#545E75',
        'fm-danger': '#D64933',
      },
      spacing: {
        xs: '5px',
        sm: '10px',
        md: '20px',
        lg: '40px',
        xl: '60px',
      },
    },
  },
  plugins: [],
};
