/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        celestial: "#0A84FF",
        emeraldAI: "#00E676",
        auraGold: "#F59E0B",
        sentinelCrimson: "#FF6B6B",
        sageViolet: "#6C63FF",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Roboto", "Segoe UI", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "lip-sync": "lipSync 0.12s infinite alternate",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 15px rgba(10, 132, 255, 0.6))" },
          "50%": { opacity: "0.7", filter: "drop-shadow(0 0 5px rgba(10, 132, 255, 0.3))" },
        },
        lipSync: {
          "0%": { transform: "scaleY(0.4)" },
          "100%": { transform: "scaleY(1.3)" },
        },
      },
    },
  },
  plugins: [],
};
