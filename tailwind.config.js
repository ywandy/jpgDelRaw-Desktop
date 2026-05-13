/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        window: "var(--shadow-window)",
        panel: "var(--shadow-panel)"
      }
    }
  },
  plugins: []
};
