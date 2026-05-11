/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        window: "0 24px 80px rgba(15, 23, 42, 0.18)",
        panel: "0 12px 34px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
