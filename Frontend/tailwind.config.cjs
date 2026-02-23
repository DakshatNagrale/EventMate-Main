/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f8fafc",
          200: "#e2e8f0",
          400: "#94a3b8",
          700: "#334155",
          900: "#0f172a"
        },
        sand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa"
        },
        ember: {
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c"
        },
        ocean: {
          300: "#7dd3fc",
          500: "#0ea5e9",
          600: "#0284c7"
        }
      },
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        serif: ["Fraunces", "ui-serif", "Georgia"]
      },
      boxShadow: {
        glow: "0 20px 50px rgba(15, 23, 42, 0.12)",
        glass: "0 18px 40px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xl: "1.25rem"
      }
    }
  },
  plugins: []
};
