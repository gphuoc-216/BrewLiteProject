/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#faf6f0',
          100: '#f3e8dc',
          200: '#e6cfb9',
          300: '#d5b292',
          400: '#c4946e',
          500: '#a8754f',
          600: '#8c593a',
          700: '#6f422b',
          800: '#543020',
          900: '#381f14',
          950: '#231109',
        },
      },
    },
  },
  plugins: [],
};
