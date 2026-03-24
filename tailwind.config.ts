import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0F14",
        surface: "#121821",
        surfaceAlt: "#1A2430",
        border: "#2A3645",
        text: "#E7EDF5",
        muted: "#9FB0C3",
        accent: "#30C5A1"
      },
      boxShadow: {
        card: "0 10px 25px rgba(0,0,0,0.25)"
      }
    }
  },
  plugins: []
};

export default config;
