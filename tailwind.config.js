/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        gradientFrom: "#6D5EF3",
        gradientTo: "#8B7CFF",
      },
      backgroundImage: {
        "hero-pattern": "url('/hero-bg.svg')",
      },
    },
  },
  plugins: [],
};
