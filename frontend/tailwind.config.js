/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          mint: "#3AA69A",
          mintLight: "#4DCBBF",
          dark: "#2F353E",
          surface: "#3A4049",
          border: "#474E59",
          paper: "#FAFDFF",
          paperMuted: "#9DA5B4",
          granted: "#2ECC71",
          denied: "#E74C3C",
          warning: "#F1C40F",
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
