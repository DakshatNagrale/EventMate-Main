// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  darkMode: "class", // Ensures manual control via <html class="dark">
  theme: {
    extend: {
      colors: {
        // Custom EventMate palette
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          500: "#818cf8",
          600: "#6366f1",
          700: "#4f46e5",
          800: "#4338ca",
          900: "#3730a3",
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}