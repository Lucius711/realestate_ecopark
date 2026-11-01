import type { Config } from "tailwindcss";

// Design tokens taken from the Figma file "Nguyen Tuan Ecopark – Website" (V2).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        esp: "#2B2420",
        esp2: "#3A302A",
        espDeep: "#231D1A",
        gold: "#B08A4F",
        goldL: "#D9BD8C",
        cream: "#F7F1E6",
        creamT: "#FBF6EC",
        sand: "#D9C7A3",
        muted: "#6E6257",
        soft: "#BFB3A3",
        line: "#DDD0B8",
        lineL: "#E6DCCB",
        ink: "#2D2D2D",
        page: "#FAF7F2",
        price: "#B03A2E",
        verified: "#2F7A4B",
        zalo: "#0068FF",
      },
      fontFamily: {
        sans: ["'Manrope Variable'", "Manrope", "system-ui", "sans-serif"],
      },
      maxWidth: { site: "1200px" },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: { fadeIn: "fadeIn .5s ease-out" },
    },
  },
  plugins: [],
};
export default config;
