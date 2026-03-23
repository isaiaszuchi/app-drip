/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nubank-purple': "#8A05BE", // Cor clássica do Nubank
        'nubank-purple-dark': "#71049B",
        'nubank-purple-light': "#9C36C3",
        purple: {
          DEFAULT: "#8A05BE",
          dark: "#71049B",
          light: "#9C36C3",
          muted: "rgba(138, 5, 190, 0.08)",
        },
        gray: {
          50: "#F5F5F7", // Cinza claro clássico Nu
          100: "#EBEBEF",
          250: "#EEEEEE",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          900: "#1A1A1B",
        },
        ink: "#1A1A1B",
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 4px 10px rgba(0,0,0,0.02)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.04)',
        'purple-glow': '0 4px 14px rgba(138, 5, 190, 0.3)',
      }
    },
  },
  plugins: [],
}
