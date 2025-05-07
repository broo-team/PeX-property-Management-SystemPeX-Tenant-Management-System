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
        'primary': {
          'green': '#4ADE80',
          'blue': '#3B82F6',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, var(--primary-green), var(--primary-blue))',
      },
    },
  },
  plugins: [],
};