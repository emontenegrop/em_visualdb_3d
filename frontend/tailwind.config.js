/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#050a14",
          panel: "#0a1628",
          border: "#1a2d4a",
          primary: "#00d4ff",
          secondary: "#7c3aed",
          accent: "#ff2d78",
          text: "#c9d8f0",
          muted: "#4a6080",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
