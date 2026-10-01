/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          black: "#0B0E14",
          charcoal: "#121824",
        },
        mc: {
          red: "#EB001B",
          orange: "#F79E1B",
          amber: "#FF5F00",
          gold: "#FFA800",
        },
      },
    },
  },
  plugins: [],
};
