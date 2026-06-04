/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        tempo: {
          blue: "#00A5D6",
          orange: "#F15C22",
          violet: "#B840FF",
          dark: "#0B0E1A",
          panel: "#12182B",
          border: "#1E2A45",
        },
      },
      fontFamily: {
        display: ["Trebuchet MS", "Segoe UI", "sans-serif"],
        body: ["Calibri", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 165, 214, 0.45)",
        "neon-orange": "0 0 24px rgba(241, 92, 34, 0.5)",
        "neon-violet": "0 0 24px rgba(184, 64, 255, 0.45)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out forwards",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.85", filter: "brightness(1.15)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
    },
  },
  plugins: [],
};