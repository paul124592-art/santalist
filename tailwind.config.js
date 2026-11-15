/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka"', '"Baloo 2"', 'ui-rounded', 'system-ui', 'sans-serif'],
        body: ['"Nunito"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        santa: {
          red: '#C62828',
          darkred: '#8E1B1B',
          green: '#2E7D32',
          cream: '#FFF8F0',
          gold: '#F9A825',
        },
      },
    },
  },
  plugins: [],
}
