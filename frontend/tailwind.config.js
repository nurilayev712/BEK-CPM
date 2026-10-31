/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cpm: {
          dark: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          accent: '#ff5e00', // CPM Orange
          accentHover: '#e05300',
          cyan: '#00f0ff',
          neonGreen: '#00ff66'
        }
      }
    },
  },
  plugins: [],
}
