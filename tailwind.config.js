/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        celestial: "#0A84FF",
        emerald: {
          400: "#00E676",
          500: "#00C853"
        }
      }
    },
  },
  plugins: [],
}
