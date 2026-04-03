/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        hub: {
          bg: '#0f1117',
          surface: '#1a1d27',
          border: '#2d3148',
          accent: '#5b6af0',
          text: '#e2e8f0',
          muted: '#64748b'
        }
      }
    }
  },
  plugins: []
}
