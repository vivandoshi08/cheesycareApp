import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#0070FF",
        "brand-black": "#232323",
        "brand-white": "#FFFFFF",
        "brand-light-highlight": "#E6E6E6",
        "brand-dark-highlight": "#929FB4",
        "brand-light-shadow": "#3C679D",
        "brand-dark-shadow": "#003375",
        "brand-orange": "#F77F00",
      },
      fontFamily: {
        sans: ["Futura LT", "sans-serif"],
        heading: ["Franklin Gothic Heavy", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config; 