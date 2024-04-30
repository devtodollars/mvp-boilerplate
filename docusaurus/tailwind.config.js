const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false,
    container: false,
  },
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{jsx,tsx,html}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        wood: ['WoodHeinzNo2', ...fontFamily.sans],
        mont: ['Montserrat', ...fontFamily.sans],
      },
      borderRadius: {
        sm: "4px",
      },
      screens: {
        sm: "0px",
        lg: "997px",
      },
      colors: {
        primary: "#ffca28",
        surface1: "#343434",
        surface2: "#1b1b1d",
        gray: {
          50: '#e5e5e5',
          100: '#cccccc',
          200: '#b3b3b3',
          300: '#999999',
          400: '#808080',
          500: '#666666',
          600: '#4d4d4d',
          700: '#343434',
          800: '#1b1b1d',
          900: '#000000',
        },
      },
    },
  },
  plugins: [],
};
