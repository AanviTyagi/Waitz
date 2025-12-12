/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007BFF', // Electric Blue
        secondary: '#52E6C8', // Neon Mint
        accent: {
          yellow: '#FFD369',
          orange: '#FF7A59'
        },
        dark: '#0D0F16',
        light: '#F8FAFC'
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #007BFF 0%, #52E6C8 100%)',
      }
    },
  },
  plugins: [],
}
