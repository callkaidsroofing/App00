/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'roofing-blue': '#007ACC',
        'roofing-navy': '#0B3B69',
        'roofing-charcoal': '#111827',
        'roofing-grey': '#6B7280',
        'roofing-off-white': '#F7F8FA',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

