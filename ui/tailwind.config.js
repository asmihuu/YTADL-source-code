/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkgrey: "#1E1E1E",
        pastelbrown: "#C49A6C",
        brown: {
          200: "#d4bfa3",
          400: "#b08968",
          500: "#9c6644",
          600: "#7f5539",
        },
      },
    },
    plugins: [],
  },
};